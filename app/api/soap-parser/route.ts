import { NextResponse } from "next/server";

interface SlotInput {
  slotId: string;
  compntName: string;
  itmName: string;
  itmCode: string | null;
  soap: "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN";
  currentValue: string;
  allowedValues: string[] | null;
}

interface FactInput {
  text: string;
  group: string;
}

interface ParserRequestBody {
  transcript?: string;
  facts?: FactInput[];
  slots?: SlotInput[];
}

const MAX_TRANSCRIPT_CHARS = 6000;

const SYSTEM_PROMPT = `You are an experienced physician's clinical scribe, charting a visit live in an EMR's SOAP module, the way a real doctor would document it — not a transcript summarizer.

You are given:
1. A live transcript of an in-progress patient visit (may include a doctor and a patient, possibly speaker-labeled).
2. Clinical facts already extracted from the conversation by a separate speech AI (symptoms, history, meds, etc).
3. A list of "slots" — every chartable field currently available for this visit, across the WHOLE encounter sheet (not just one section). Each slot has:
   - slotId (use verbatim, never alter)
   - compntName — the section/component it belongs to (e.g. "Vitals", "Chief Complaint", "Assessment", "Plan")
   - itmName — the field label (e.g. "Height", "Onset", "Severity", "Essential Hypertension (I10)")
   - itmCode — a short code (numeric vitals like HEIGHT/WEIGHT/BP_SYSTOLIC/BP_DIASTOLIC/PULSE/TEMP/RESP_RATE/O2_SAT/BMI expect ONLY the bare number as generatedText, no units — the UI appends units itself)
   - soap — which SOAP section it lives in
   - currentValue — what's already charted there, if anything
   - allowedValues — when present, this field is a fixed choice (checkbox/dropdown); PREFER one or more of these values verbatim (comma-separate for multi-select) whenever what was said genuinely matches one

Your job: chart this visit as completely and correctly as a real doctor would, using every slot that fits — not just the most obvious one.

Rules:
- Ground everything in the transcript/facts. Never invent, guess, or infer findings not actually stated.
- COVERAGE MATTERS: a real doctor's chart doesn't drop details just because the loudest slot is already full. If the sheet offers dedicated fields for something mentioned (e.g. an "Onset" or "Severity" field alongside a "Chief Complaint" narrative field), use them — don't cram everything into one slot when better-fitting slots exist. Scan ALL provided slots across ALL sections before deciding, including ones not in the currently-active section.
- When a slot has allowedValues, pick the closest matching value(s) from that exact list verbatim whenever one genuinely fits. If what was actually said doesn't fit any of them, write concise free text instead — never force a wrong or overly-loose match just to stay inside the list, and never skip a slot you have real grounded content for just because none of the fixed options fit.
- For narrative slots (history, exam findings, assessment, plan), write the way a doctor actually charts: concise, clinical, telegraphic phrasing — sentence fragments joined by commas/semicolons are fine and preferred over full grammatical sentences (e.g. "Cough x1 week, progressively worsening. Dry, occasional yellow sputum, worse at night. Low-grade fever ~100°F x2-3 days, resolved."). Never write "Patient states..." preambles or quote the transcript verbatim.
- Every response should reflect the FULLEST, most complete picture of what's grounded so far for that slot — not just the newest fragment. Your generatedText for a slot fully REPLACES its currentValue, so re-synthesize everything relevant said about that slot across the whole transcript each time, don't just append the latest sentence.
- If a slot already has a currentValue and there's nothing new to add, omit that slot — don't resend an unchanged value.
- If you have nothing grounded to propose, return an empty updates array. Do not pad the response with speculative content.
- Output ONLY a JSON object of the exact shape: {"updates": [{"slotId": "...", "generatedText": "..."}]}. No prose, no markdown fences, no commentary.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "z-ai/glm-5.3";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ParserRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").slice(-MAX_TRANSCRIPT_CHARS);
  const facts = Array.isArray(body.facts) ? body.facts : [];
  const slots = Array.isArray(body.slots) ? body.slots : [];

  if (slots.length === 0) {
    return NextResponse.json({ updates: [] });
  }
  if (!transcript.trim() && facts.length === 0) {
    return NextResponse.json({ updates: [] });
  }

  const knownSlotIds = new Set(slots.map((slot) => slot.slotId));

  const userPrompt = JSON.stringify({
    transcript,
    facts: facts.map((fact) => ({ text: fact.text, group: fact.group })),
    slots,
  });

  // Starting ceiling — kept well under providers' practical per-request
  // limit (8000 was routinely hit in full, finish_reason "length",
  // truncating the JSON mid-object). Lowered further on the fly below if
  // OpenRouter reports the account can't currently afford this many.
  const DEFAULT_MAX_TOKENS = 4096;
  // Below this, a chart-sync response can't fit enough of a useful answer
  // (a couple of slot updates' worth of JSON) — not worth attempting.
  const MIN_MAX_TOKENS = 512;

  function buildRequestBody(maxTokens: number): string {
    return JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      // OpenRouter can route "z-ai/glm-5.3" to several backing providers with
      // wildly different speed (observed: 3.8 tok/s / ~90s time-to-first-token
      // on one vs 300+ tok/s / <1s on another for the identical request) — the
      // model isn't slow, the provider picked for a given request can be.
      // Sorting by throughput steers away from the slow ones instead of
      // eating their latency on every sync tick.
      provider: { sort: "throughput" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  }

  // OpenRouter's 402 for "requires more credits, or fewer max_tokens" names
  // exactly how many tokens the account can currently afford — e.g. "You
  // requested up to 4096 tokens, but can only afford 2948". Parsed out so a
  // low balance can be worked around by asking for less, instead of the
  // whole sync failing outright every time credits run a little low.
  function affordableMaxTokens(detail: string): number | null {
    const match = detail.match(/can only afford (\d+) tokens/i);
    if (!match) return null;
    return Number(match[1]);
  }

  function stripFences(content: string): string {
    return content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }

  /**
   * A response cut off mid-JSON (finish_reason "length", or any other
   * truncation) fails a plain JSON.parse and used to drop the whole tick's
   * updates. Instead, scan the "updates" array by brace-balance and keep
   * every complete {"slotId":...,"generatedText":...} object that appeared
   * before the cutoff — a partial sync beats none.
   */
  function salvageTruncatedUpdates(
    content: string
  ): { updates: { slotId?: string; generatedText?: string }[] } | null {
    const arrayStart = content.indexOf('"updates"');
    if (arrayStart === -1) return null;
    const bracketStart = content.indexOf("[", arrayStart);
    if (bracketStart === -1) return null;

    const updates: { slotId?: string; generatedText?: string }[] = [];
    let depth = 0;
    let objStart = -1;
    for (let i = bracketStart + 1; i < content.length; i++) {
      const ch = content[i];
      if (ch === "{") {
        if (depth === 0) objStart = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && objStart !== -1) {
          try {
            updates.push(JSON.parse(content.slice(objStart, i + 1)));
          } catch {
            // Malformed individual object — skip it, keep scanning.
          }
          objStart = -1;
        }
      } else if (ch === "]" && depth === 0) {
        break;
      }
    }
    return updates.length > 0 ? { updates } : null;
  }

  function extractUpdates(
    content: string
  ): { updates?: { slotId?: string; generatedText?: string }[] } {
    const cleaned = stripFences(content);
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const salvaged = salvageTruncatedUpdates(cleaned);
      if (salvaged) return salvaged;
      throw err;
    }
  }

  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 500;
  // Bounds how long a single attempt can hang on a slow provider. Without
  // this, a provider with a 90s time-to-first-token (seen in production —
  // see comment on `provider` above) blocks the whole sync tick for that
  // long per attempt, which is the "freeze" users were hitting.
  const ATTEMPT_TIMEOUT_MS = 20000;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let parsed: { updates?: { slotId?: string; generatedText?: string }[] } | null = null;
  let lastError = "Unknown error.";
  let maxTokens = DEFAULT_MAX_TOKENS;

  // OpenRouter (and whatever provider it routes to) intermittently 502s,
  // times out, or returns a malformed/truncated body — a real, recurring
  // failure mode with this much payload, not just a theoretical one. This
  // covers all failure modes (network error, timeout, non-2xx response,
  // invalid JSON) with one retry loop.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), ATTEMPT_TIMEOUT_MS);

    let completionRes: Response;
    try {
      completionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: buildRequestBody(maxTokens),
        cache: "no-store",
        signal: abortController.signal,
      });
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      lastError = isTimeout
        ? `OpenRouter timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s.`
        : "Could not reach OpenRouter.";
      console.error(`[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: fetch failed —`, err);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!completionRes.ok) {
      const detail = await completionRes.text().catch(() => "");
      lastError = `OpenRouter request failed (${completionRes.status}). ${detail}`.trim();

      if (completionRes.status === 402) {
        const affordable = affordableMaxTokens(detail);
        if (affordable !== null && affordable >= MIN_MAX_TOKENS) {
          // Not a hard stop — the account just can't cover the ceiling we
          // asked for right now. Retry immediately at what it says it can
          // afford (with a small safety margin) rather than burning this
          // whole tick over a number we control.
          maxTokens = Math.max(MIN_MAX_TOKENS, affordable - 64);
          console.warn(
            `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: 402 — low balance, retrying with max_tokens=${maxTokens}`
          );
          if (attempt < MAX_ATTEMPTS) continue;
        }
        console.error(
          `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: OpenRouter returned 402 (insufficient credits) —`,
          detail.slice(0, 500)
        );
        break;
      }

      console.error(
        `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: OpenRouter returned ${completionRes.status} —`,
        detail.slice(0, 500)
      );
      // 429 (rate limit) is the account telling us to back off, not a
      // transient blip. Retrying within the same 500ms-spaced loop just
      // burns attempts against a still-closed door and risks the retry
      // colliding with the *next* scheduled 18s sync tick, compounding the
      // very "too many in-flight requests" problem that caused this. Fail
      // this tick immediately instead — the orchestrator's own next
      // scheduled tick is the real retry here.
      if (completionRes.status === 429) break;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      continue;
    }

    const completion = (await completionRes.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[];
    };
    const choice = completion.choices?.[0];
    const raw = choice?.message?.content ?? "";

    if (choice?.finish_reason === "length") {
      console.warn(
        `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: response truncated at max_tokens — salvaging complete objects.`
      );
    }

    try {
      parsed = extractUpdates(raw);
      break;
    } catch (err) {
      lastError = "AI response was not valid JSON.";
      console.error(
        `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: response was not valid JSON —`,
        err,
        "raw (first 500 chars):",
        raw.slice(0, 500)
      );
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }

  if (!parsed) {
    console.error(`[soap-parser] giving up after ${MAX_ATTEMPTS} attempts — ${lastError}`);
    return NextResponse.json({ error: lastError }, { status: 502 });
  }

  const slotById = new Map(slots.map((slot) => [slot.slotId, slot]));

  const updates = (parsed.updates ?? [])
    .filter(
      (update): update is { slotId: string; generatedText: string } =>
        typeof update.slotId === "string" &&
        typeof update.generatedText === "string" &&
        update.generatedText.trim().length > 0 &&
        knownSlotIds.has(update.slotId)
    )
    .map((update) => ({ slotId: update.slotId, generatedText: update.generatedText.trim() }))
    .map((update) => {
      const slot = slotById.get(update.slotId);
      if (!slot?.allowedValues || slot.allowedValues.length === 0) return update;
      // Enum-constrained field: when every comma-separated token matches an
      // allowed value (case-insensitive), normalize to that value's
      // canonical casing. When the model charted something real that just
      // isn't spelled the exact catalog way — or doesn't fit the fixed list
      // at all — don't discard it: a doctor's note beats an empty field, so
      // it's kept as free text rather than silently dropping the slot.
      const canonicalByLower = new Map(slot.allowedValues.map((v) => [v.toLowerCase(), v]));
      const tokens = update.generatedText.split(",").map((token) => token.trim()).filter(Boolean);
      const allMatch = tokens.length > 0 && tokens.every((token) => canonicalByLower.has(token.toLowerCase()));
      if (!allMatch) return update;
      return {
        slotId: update.slotId,
        generatedText: tokens.map((token) => canonicalByLower.get(token.toLowerCase())!).join(", "),
      };
    });

  return NextResponse.json({ updates });
}
