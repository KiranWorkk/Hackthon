# Echo — AI Ambient Scribe for Clinical Charting

*Hackathon Presentation*

---

## 1. The Problem (Non-Technical)

### The pain
Doctors spend more time typing than treating. A single outpatient visit requires filling in dozens of structured fields across a SOAP note — Chief Complaint, History, Vitals, Physical Exam, Assessment, Plan — while also trying to hold a real conversation with the patient. Industry surveys consistently point to documentation burden as a leading driver of physician burnout: for every hour of face time, clinicians often spend one to two more hours on paperwork.

On top of that, any solution that "listens in" on a patient visit runs straight into a second problem: **consent and compliance**. You can't just turn on a microphone in an exam room — patients need to be clearly told they're being recorded, and that consent needs to be captured and auditable.

### Who this helps
- **Clinicians** — reclaim time and attention that currently goes into data entry, and get a note that's mostly written by the time the visit ends.
- **Patients** — get a doctor who is looking at them instead of a screen, with an explicit, recorded consent step protecting their privacy.
- **Billing/coding staff** — get AI-suggested ICD-10/CPT codes derived directly from the finished note, instead of manual chart review.

### The idea: Echo
Echo is an ambient AI scribe embedded directly into an EHR-style charting workflow (modeled on a real EHR's "Charting V2" screen). During a visit, Echo:

1. **Asks for consent** — plays a spoken HIPAA-style disclosure to the patient and listens for a verbal "yes," logging the exchange to an audit trail.
2. **Listens** — streams the conversation to a diarizing speech engine that tells doctor and patient apart in real time.
3. **Drafts the chart** — every ~18 seconds, reconciles what's been said against every fillable field in the active encounter sheet and writes clinically-phrased draft entries.
4. **Keeps humans in control** — nothing the AI writes is final. Every AI-authored field is flagged "pending approval" until the clinician explicitly accepts or rejects it.
5. **Shows its work** — an Evidence tab links every drafted field back to the transcript segment that produced it, so a clinician can audit "why did it write that?"
6. **Suggests billing codes** — once the note is complete, predicts ICD-10-CM/PCS and CPT codes with supporting evidence.

**In short: a 20-30 minute manual charting chore becomes a live-generated draft that's ready for a two-minute review.**

---

## 2. How It Works (Technical)

### Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4, shadcn/radix-ui, Motion for animation.
- **No AI SDK dependency** — all LLM/vendor calls are raw `fetch`/native `WebSocket` from Next.js API routes, keeping the surface area small and every request inspectable.
- **Package manager:** pnpm.

### AI pipeline

```
Patient visit
     │
     ▼
Consent flow  ──────────────►  /api/consent-speech  (TTS disclosure, OpenRouter openai/gpt-audio-mini)
     │  (patient says "yes")        │
     ▼                              ▼
10s response clip  ─────────►  /api/consent-listen  (transcribe + classify: true/false/null)
     │                              → audit log (patientId, timestamp, method)
     ▼
"Listen" pressed
     │
     ▼
/api/corti/session  ──► Corti WebSocket (live diarized transcript + clinical fact extraction)
     │
     ▼ (every 18s, single-flight sync loop)
useSoapOrchestrator  ──► /api/soap-parser  (OpenRouter LLM, strict-JSON slot-filling)
     │        transcript + facts + full field catalog → {slotId, generatedText}[]
     ▼
ChartingV2View state  ──► fields marked "pending approval" until clinician accepts
     │
     ▼
EvidenceSection  ──► cross-references transcript segments ↔ chart updates ("Reflected in chart")
     │
     ▼ (visit ends)
/api/corti/coding  ──► ICD-10-CM/PCS + CPT predictions w/ evidence → MedicalCodesPanel
```

### Two AI vendors, two jobs
- **Corti** (clinical-AI vendor): real-time diarized transcription over WebSocket + clinical fact extraction, and a dedicated medical-coding endpoint (`/v2/tools/coding/`) for billing code prediction. Auth via short-lived OAuth tokens minted server-side only — secrets never reach the browser.
- **OpenRouter** (model-agnostic LLM gateway): the reasoning engine that turns transcript + facts into structured chart entries (`/api/soap-parser`), plus the audio-capable model used for consent TTS/STT. Model is swappable via env var — the team experimented across providers for cost/latency/quality (including working around throughput variance between OpenRouter backends).

### Engineering details worth highlighting
- **Human-in-the-loop governance**: a `pendingApprovalPkeys` set gates every AI-written field behind explicit clinician approval — nothing is silently trusted.
- **Evidence traceability**: transcript segments are tagged "reflected in chart" vs. "not yet charted" at the batch level, so AI output stays auditable.
- **Consent hardening**: client-side silence detection (RMS threshold) before sending audio to the classifier, added after observing the model hallucinate `consent: true` on a silent clip.
- **Resilient LLM calls**: brace-balanced JSON salvage for truncated responses, retry/backoff on 402/429, dynamic `max_tokens`, and canonicalization against catalog-constrained enum values.
- **Fidelity to production**: the UI's data shapes (`ComponentItemWrapper`/`ComponentItem`/`ComponentItemValue`) were deliberately aligned to match a real EHR's actual API response shapes, not just a visual clone.

---

## 3. Demo Flow (Suggested)

1. Open Appointments → select a patient → Start Charting.
2. Click **Listen** → consent dialog plays disclosure → patient says "yes" (auto-detected) → recording begins.
3. Run through the scripted new-patient conversation (chief complaint, history, meds, vitals, exam findings).
4. Watch chart fields populate live across sections, each marked pending.
5. Open the Evidence tab to show transcript → chart traceability.
6. Approve the AI-drafted fields.
7. End the visit → open the Medical Coding tab to show predicted ICD-10/CPT codes with evidence.

---

## 4. What's Next
- Server-side, HIPAA-retained consent audit log (currently a sessionStorage-backed prototype).
- Per-field (not batch-level) evidence attribution.
- Multi-visit/session persistence and real auth.
