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

  const requestBody = JSON.stringify({
    model,
    temperature: 0.1,
    // Generous ceiling so a chart with many pending updates (a big encounter
    // sheet, early in a visit) can't get its JSON cut off mid-object — a
    // truncated response fails to parse below and drops the whole tick's
    // updates, not just the last one.
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  function extractUpdates(content: string): { updates?: { slotId?: string; generatedText?: string }[] } {
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    return JSON.parse(cleaned);
  }

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 500;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let parsed: { updates?: { slotId?: string; generatedText?: string }[] } | null = null;
  let lastError = "Unknown error.";

  // OpenRouter (and whatever model/provider it routes to) intermittently
  // 502s or returns a malformed/truncated body — a real, recurring failure
  // mode with this much payload, not just a theoretical one. A single bad
  // tick used to silently drop that whole batch of chart updates with no
  // retry at all for the "OpenRouter responded with an error" case (only
  // the "response wasn't valid JSON" case retried) — this covers all three
  // failure modes (network error, non-2xx response, invalid JSON) uniformly.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let completionRes: Response;
    try {
      completionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
        cache: "no-store",
      });
    } catch (err) {
      lastError = "Could not reach OpenRouter.";
      console.error(`[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: fetch failed —`, err);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      continue;
    }

    if (!completionRes.ok) {
      const detail = await completionRes.text().catch(() => "");
      lastError = `OpenRouter request failed (${completionRes.status}). ${detail}`.trim();
      console.error(
        `[soap-parser] attempt ${attempt}/${MAX_ATTEMPTS}: OpenRouter returned ${completionRes.status} —`,
        detail.slice(0, 500)
      );
      // 429 (rate limit) and 402 (e.g. OpenRouter's "in-flight budget
      // exhausted" — too many concurrent/still-settling requests for the
      // account's credit balance) are the account telling us to back off,
      // not a transient blip. Retrying within the same 500ms-spaced loop
      // just burns attempts against a still-closed door and risks the retry
      // colliding with the *next* scheduled 18s sync tick, compounding the
      // very "too many in-flight requests" problem that caused this. Fail
      // this tick immediately instead — the orchestrator's own next
      // scheduled tick is the real retry here.
      if (completionRes.status === 429 || completionRes.status === 402) break;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      continue;
    }

    const completion = (await completionRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = completion.choices?.[0]?.message?.content ?? "";

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
