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
   - allowedValues — when present, this field is a fixed choice (checkbox/dropdown), and generatedText MUST be one or more of these values verbatim (comma-separate for multi-select), never free text

Your job: chart this visit as completely and correctly as a real doctor would, using every slot that fits — not just the most obvious one.

Rules:
- Ground everything in the transcript/facts. Never invent, guess, or infer findings not actually stated.
- COVERAGE MATTERS: a real doctor's chart doesn't drop details just because the loudest slot is already full. If the sheet offers dedicated fields for something mentioned (e.g. an "Onset" or "Severity" field alongside a "Chief Complaint" narrative field), use them — don't cram everything into one slot when better-fitting slots exist. Scan ALL provided slots across ALL sections before deciding, including ones not in the currently-active section.
- When a slot has allowedValues, pick the closest matching value(s) from that exact list — never write free text for it.
- For narrative slots (history, exam findings, assessment, plan), write the way a doctor actually charts: concise, clinical, telegraphic phrasing — sentence fragments joined by commas/semicolons are fine and preferred over full grammatical sentences (e.g. "Cough x1 week, progressively worsening. Dry, occasional yellow sputum, worse at night. Low-grade fever ~100°F x2-3 days, resolved."). Never write "Patient states..." preambles or quote the transcript verbatim.
- Every response should reflect the FULLEST, most complete picture of what's grounded so far for that slot — not just the newest fragment. Your generatedText for a slot fully REPLACES its currentValue, so re-synthesize everything relevant said about that slot across the whole transcript each time, don't just append the latest sentence.
- If a slot already has a currentValue and there's nothing new to add, omit that slot — don't resend an unchanged value.
- If you have nothing grounded to propose, return an empty updates array. Do not pad the response with speculative content.
- Output ONLY a JSON object of the exact shape: {"updates": [{"slotId": "...", "generatedText": "..."}]}. No prose, no markdown fences, no commentary.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4.1";

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

  let completionRes: Response;
  try {
    completionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach OpenRouter." },
      { status: 502 }
    );
  }

  if (!completionRes.ok) {
    const detail = await completionRes.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenRouter request failed (${completionRes.status}). ${detail}`.trim() },
      { status: 502 }
    );
  }

  const completion = (await completionRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = completion.choices?.[0]?.message?.content ?? "";

  let parsed: { updates?: { slotId?: string; generatedText?: string }[] };
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "AI response was not valid JSON." },
      { status: 502 }
    );
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
    .filter((update) => {
      const slot = slotById.get(update.slotId);
      if (!slot?.allowedValues || slot.allowedValues.length === 0) return true;
      // Enum-constrained field: every comma-separated token must match an allowed value
      // (case-insensitive) — drop the whole update if the model hallucinated free text.
      const allowedLower = new Set(slot.allowedValues.map((v) => v.toLowerCase()));
      return update.generatedText
        .split(",")
        .map((token) => token.trim().toLowerCase())
        .every((token) => allowedLower.has(token));
    })
    .map((update) => {
      const slot = slotById.get(update.slotId);
      if (!slot?.allowedValues || slot.allowedValues.length === 0) return update;
      // Normalize to the canonical casing from allowedValues.
      const canonicalByLower = new Map(slot.allowedValues.map((v) => [v.toLowerCase(), v]));
      const normalized = update.generatedText
        .split(",")
        .map((token) => canonicalByLower.get(token.trim().toLowerCase()) ?? token.trim())
        .join(", ");
      return { slotId: update.slotId, generatedText: normalized };
    });

  return NextResponse.json({ updates });
}
