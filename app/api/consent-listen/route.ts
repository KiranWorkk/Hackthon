import { NextResponse } from "next/server";

const CLASSIFY_SYSTEM_PROMPT =
  "You are listening to a short audio clip recorded in a medical office. A clinician just asked a patient, out loud, " +
  "whether they consent to this visit being audio recorded and processed by an AI assistant for clinical documentation. " +
  "This clip is the patient's response (it may also contain silence, background noise, or an unrelated remark). " +
  "Transcribe exactly what was said, then classify it:\n" +
  '- true: the patient clearly gave affirmative consent (e.g. "yes", "sure", "okay", "I consent", "go ahead", "that\'s fine")\n' +
  '- false: the patient clearly declined (e.g. "no", "I don\'t consent", "please don\'t", "stop")\n' +
  "- null: anything else — silence, an unclear or unrelated response, or a response that doesn't clearly go either way\n\n" +
  "CRITICAL: this clip may contain no speech at all — silence, only background noise, or a cut-off/empty recording. " +
  'In that case transcript MUST be an empty string "" and consent MUST be null. Never invent, guess, or hallucinate ' +
  "words that are not clearly and actually audible in the clip, even if silence would otherwise seem like an unhelpful answer.\n\n" +
  'Output ONLY a JSON object of the exact shape: {"transcript": "...", "consent": true | false | null}. No prose, no markdown fences.';

interface ClassifyResult {
  transcript?: string;
  consent?: boolean | null;
}

/**
 * Transcribes and classifies the patient's spoken consent response in one
 * call, using the same audio-capable chat model already used to speak the
 * disclosure (see /api/consent-speech) — cheaper and simpler than a
 * separate dedicated transcription endpoint for a clip this short, and
 * OpenRouter doesn't expose a standalone Whisper-style endpoint anyway.
 * Text-only output, so no streaming/pcm reassembly needed (unlike the TTS
 * route) — this is a plain, fast chat completion.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_TTS_MODEL || "openai/gpt-audio-mini";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { audioBase64?: string; format?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.audioBase64) {
    return NextResponse.json({ error: "No audio provided." }, { status: 400 });
  }
  // Confirmed directly against the API: only "wav" and "mp3" are accepted
  // for audio input — anything else (e.g. "webm", what MediaRecorder
  // produces by default) is rejected with a 400, hence the client encodes
  // to WAV itself before calling this route.
  const format = body.format === "mp3" ? "mp3" : "wav";

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 15000);

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
        modalities: ["text"],
        temperature: 0,
        max_tokens: 300,
        // Confirmed directly against the API: this model rejects
        // response_format:"json_object" ("not supported with this model")
        // when the input includes audio — rely on the prompt instead and
        // parse leniently below (same pattern as /api/soap-parser).
        messages: [
          { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "input_audio", input_audio: { data: body.audioBase64, format } },
            ],
          },
        ],
      }),
      cache: "no-store",
      signal: abortController.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    console.error("[consent-listen] fetch failed —", err);
    return NextResponse.json(
      { error: isTimeout ? "Timed out analyzing the response." : "Could not reach OpenRouter." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!completionRes.ok) {
    const detail = await completionRes.text().catch(() => "");
    console.error(`[consent-listen] OpenRouter returned ${completionRes.status} —`, detail.slice(0, 500));
    return NextResponse.json(
      { error: `OpenRouter request failed (${completionRes.status}).` },
      { status: 502 }
    );
  }

  const completion = (await completionRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = completion.choices?.[0]?.message?.content ?? "";

  let parsed: ClassifyResult;
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, ""));
  } catch (err) {
    console.error("[consent-listen] response was not valid JSON —", err, raw.slice(0, 300));
    return NextResponse.json({ error: "Could not parse the response." }, { status: 502 });
  }

  const consent = parsed.consent === true ? true : parsed.consent === false ? false : null;
  return NextResponse.json({ transcript: parsed.transcript ?? "", consent });
}
