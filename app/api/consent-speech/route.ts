import { NextResponse } from "next/server";

/**
 * Fixed, server-owned disclosure text — never accepts arbitrary text from
 * the client. This keeps the endpoint from being usable as an open
 * text-to-speech proxy, and keeps no patient-identifying detail in the
 * request (the statement is generic; the patient is named/consented to by
 * the clinician in person, not by the audio itself).
 */
const DISCLOSURE_TEXT =
  "This visit is being audio recorded and processed by an AI assistant to help create your clinical documentation. " +
  "The recording and any notes generated from it will be stored as part of your medical record and protected under HIPAA. " +
  "Do you consent to being recorded for this purpose?";

const TTS_SYSTEM_PROMPT =
  "You are a warm, natural-sounding receptionist at a medical office speaking to a patient in person, with a friendly American accent. " +
  "Read the user's message aloud exactly as written, verbatim — every word, don't paraphrase or shorten it — " +
  "but deliver it like a real person talking, not a robotic reader: natural pacing, natural intonation, a brief warm pause before the final question. " +
  "Do not add any words before or after it — no greeting, no commentary, no acknowledgment, no sign-off.";

// OpenAI's (and OpenRouter's passthrough of it) audio-output chat models
// only support 24kHz mono 16-bit PCM when streamed — confirmed by hitting
// the API directly: requesting "wav" with stream:true is rejected
// ("audio.format does not support 'wav' when stream=true. Supported
// values are: 'pcm16'"), and non-streamed audio output isn't accepted at
// all ("Audio output requires stream: true"). So this always requests
// raw pcm16 chunks and wraps them in a WAV header itself below.
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SECOND = (SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8;

// A first (uncapped) test run of this exact disclosure looped and generated
// ~14 minutes of audio for what should be ~30s of speech — confirmed by
// hitting the API directly. max_tokens bounds normal generation; the
// MAX_PCM_BYTES cancel below is a second, independent guard so a runaway
// response can't hang this route or return a multi-MB payload even if
// max_tokens is ignored by a given provider.
const MAX_TOKENS = 1200;
const MAX_PCM_BYTES = BYTES_PER_SECOND * 90; // 90s of audio is already generous for this disclosure
const STREAM_TIMEOUT_MS = 25000;

function pcm16ToWav(pcm: Buffer): Buffer {
  const byteRate = BYTES_PER_SECOND;
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

interface StreamChunk {
  choices?: {
    delta?: { audio?: { data?: string; transcript?: string } };
  }[];
}

/**
 * Reads the SSE stream and reassembles the base64 pcm16 audio chunks
 * OpenRouter sends across many `delta.audio.data` events. Bounded two ways
 * that don't rely on the outer fetch's AbortController (aborting that after
 * the response headers already arrived did NOT reliably cancel an
 * in-progress body read in testing — the route hung for 2m41s despite a
 * 15s abort timer): a wall-clock deadline and a total-bytes cap, both of
 * which call `reader.cancel()` directly, which the stream spec guarantees
 * stops it.
 */
async function collectPcmAudio(body: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const pcmChunks: Buffer[] = [];
  let totalBytes = 0;
  let buffered = "";
  const deadline = Date.now() + STREAM_TIMEOUT_MS;

  try {
    for (;;) {
      if (Date.now() > deadline) {
        console.warn("[consent-speech] stream exceeded time budget — cancelling.");
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });

      const events = buffered.split("\n\n");
      buffered = events.pop() ?? ""; // last element may be a partial event — keep it for next read

      for (const event of events) {
        const line = event.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice("data:".length).trim();
        if (payload === "[DONE]") continue;

        try {
          const chunk = JSON.parse(payload) as StreamChunk;
          const audioData = chunk.choices?.[0]?.delta?.audio?.data;
          if (audioData) {
            const bytes = Buffer.from(audioData, "base64");
            pcmChunks.push(bytes);
            totalBytes += bytes.length;
          }
        } catch {
          // Malformed/partial SSE event — skip it, the stream keeps going.
        }
      }

      if (totalBytes >= MAX_PCM_BYTES) {
        console.warn(`[consent-speech] audio exceeded ${MAX_PCM_BYTES} bytes — cancelling stream.`);
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return Buffer.concat(pcmChunks);
}

async function generateConsentAudio(): Promise<{ audioBase64: string; format: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // Verified against OpenRouter's live model catalog: as of this writing the
  // only audio-output-capable models are openai/gpt-audio and this cheaper
  // mini variant — anything else (e.g. a "fish-audio" slug) 404s and this
  // whole endpoint silently falls back to the browser's own voice on every
  // call, defeating the point of calling OpenRouter at all.
  const model = process.env.OPENROUTER_TTS_MODEL || "openai/gpt-audio-mini";
  // "alloy" reads flat/robotic for a spoken clinical disclosure. "sage" is
  // OpenAI's warmer, more natural conversational US-accented voice — swap
  // via this env var if a different one suits your provider mix better
  // (verse/coral/shimmer/nova/ash/ballad all validated as accepted by this
  // model).
  const voice = process.env.OPENROUTER_TTS_VOICE || "sage";

  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured on the server.");
  }

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
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: 0,
        messages: [
          { role: "system", content: TTS_SYSTEM_PROMPT },
          { role: "user", content: DISCLOSURE_TEXT },
        ],
      }),
      cache: "no-store",
      signal: abortController.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    console.error("[consent-speech] fetch failed —", err);
    throw new Error(isTimeout ? "OpenRouter timed out generating consent audio." : "Could not reach OpenRouter.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!completionRes.ok || !completionRes.body) {
    const detail = await completionRes.text().catch(() => "");
    console.error(`[consent-speech] OpenRouter returned ${completionRes.status} —`, detail.slice(0, 500));
    throw new Error(`OpenRouter request failed (${completionRes.status}).`);
  }

  const pcm = await collectPcmAudio(completionRes.body);

  if (pcm.length === 0) {
    console.error("[consent-speech] response had no audio payload.");
    throw new Error("OpenRouter did not return audio.");
  }

  const wav = pcm16ToWav(pcm);
  return { audioBase64: wav.toString("base64"), format: "wav" };
}

// The disclosure text is fixed, so there's nothing patient- or
// session-specific to regenerate on every "Listen" click. Cache the first
// successful generation for the life of this server process (module-scope
// state survives across requests in Next.js's Node runtime) and serve every
// later request from it instantly — this is what actually makes the
// feature usable given how slow/variable the raw generation call is (see
// STREAM_TIMEOUT_MS above). A single in-flight promise also de-dupes
// concurrent first requests instead of firing the slow call twice.
let cachedAudio: Promise<{ audioBase64: string; format: string }> | null = null;

export async function POST() {
  if (!cachedAudio) {
    cachedAudio = generateConsentAudio().catch((err) => {
      cachedAudio = null; // let the next request retry rather than caching a permanent failure
      throw err;
    });
  }

  try {
    const audio = await cachedAudio;
    return NextResponse.json({ ...audio, text: DISCLOSURE_TEXT });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate consent audio." },
      { status: 502 }
    );
  }
}
