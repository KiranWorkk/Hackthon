# Demo Script — New Patient Visit

A read-aloud doctor/patient conversation for demoing the Corti-powered live
transcription + AI SOAP auto-fill on the **New Patient Intake** encounter
sheet. Every line here was written to touch a specific field the AI parser
can fill — either an exact value from that field's real catalog options, or
a plain narrative it can paraphrase into a TEXT-AREA/RICH-TEXT slot.

## How to use it

1. Open a chart, click **Start Charting**, choose encounter sheet
   **New Patient Intake**.
2. Click **Listen** to open ActionBridge and start the Corti session.
3. Read both sides of the conversation below out loud, at a normal pace,
   pausing briefly between lines (the AI syncs the transcript roughly every
   ~18 seconds while listening, so speaking in short exchanges rather than
   one long monologue gives it cleaner chunks to work from).
4. Watch the Subjective/Objective/Assessment/Plan tabs — items should appear
   and fill in as the conversation progresses, and again in a final pass a
   few seconds after you stop.
5. Not every possible catalog item is scripted (a real new-patient visit
   wouldn't organically mention all ~100 available options) — this script
   intentionally covers a realistic, representative subset per section so
   the demo reads naturally instead of like a checklist being read aloud.

---

## Script

**Doctor:** Good morning! I don't think we've met before — you're a new
patient with us today?

**Patient:** That's right, I just moved here and wanted to establish care
with a primary doctor. Nothing urgent going on, this is really just my
annual physical.

**Doctor:** Perfect, glad to have you. Any specific concerns today, or
mostly just the routine check-up?

**Patient:** Mostly routine. It's been building up for a while since I
haven't had a check-up in about two years, but nothing severe — I'd say
it's a mild concern at most, just wanting to make sure everything's on
track.

**Doctor:** Great, let's go through your history first. Any major medical
conditions I should know about?

**Patient:** I was diagnosed with hypertension a few years ago, and my
doctor back home also told me I have hyperlipidemia — high cholesterol.

**Doctor:** Okay, hypertension and hyperlipidemia, noted. Any surgeries in
the past?

**Patient:** I had my appendix removed when I was in my twenties — an
appendectomy — and a few years ago I had my gallbladder taken out, a
cholecystectomy.

**Doctor:** Got it. Let's talk lifestyle for a bit. Are you married?

**Patient:** Yes, married.

**Doctor:** Do you smoke, or have you ever smoked?

**Patient:** No, never smoked.

**Doctor:** And alcohol — how often would you say you drink?

**Patient:** Just socially, maybe weekly, nothing heavy.

**Doctor:** What do you do for work?

**Patient:** I'm a graduate — I finished my master's — and I work as a
teacher, so it's a fairly active, on-my-feet kind of job.

**Doctor:** Any family history I should know about — parents, siblings?

**Patient:** My mother has diabetes mellitus and hypertension. My father
has coronary artery disease — he had a heart attack in his sixties.

**Doctor:** Thank you, that's helpful. Any allergies to medications or
foods?

**Patient:** Yes — penicillin gives me a rash, so I avoid that. And
shellfish gives me hives, so I stay away from that too.

**Doctor:** Good to know, I'll flag both of those. What medications are you
currently taking?

**Patient:** Lisinopril, 10 milligrams once a day for the blood pressure,
and atorvastatin, 20 milligrams once a day for the cholesterol.

**Doctor:** Okay, let's do a quick physical exam now. First, let's get your
vitals — height, weight, and so on.

*(Nurse/assistant calls out measurements)*

**Assistant:** Height is 66 inches, weight is 150 pounds. Temperature 98.4.
Pulse 76, regular rhythm. Respiratory rate 16. Blood pressure 122 over 78.
O2 saturation 98%.

**Doctor:** Thanks. Alright, let's go through the exam. General appearance
— you're alert, well-appearing, no acute distress. Head and neck exam —
normocephalic, atraumatic, pupils equal and reactive, oropharynx clear, no
redness. Heart — regular rate and rhythm, no murmurs. Lungs — clear
bilaterally, no wheezing. Abdomen — soft, non-tender, no masses, normal
bowel sounds. Musculoskeletal — full range of motion, no swelling in any
joints. Neuro — alert and oriented, no focal deficits. Skin — warm, dry,
no rashes or lesions.

**Doctor:** Everything looks good on exam. I reviewed your recent labs —
your CBC and CMP are both within normal limits. Your lipid panel does show
elevated cholesterol, consistent with the hyperlipidemia we discussed.
A1c and TSH are both normal. Urinalysis was clean.

**Doctor:** Given your blood pressure history, let's get an EKG here in the
office today.

*(EKG performed)*

**Doctor:** EKG looks good — normal sinus rhythm, no abnormalities. Let's
also check your glucose quickly with a fingerstick.

*(Fingerstick performed)*

**Assistant:** Glucose is 95.

**Doctor:** That's a normal reading. We don't need any imaging today —
nothing in your history or exam points to needing an X-ray or anything
like that right now.

**Doctor:** Since it's flu season and you're due, let's go ahead and give
you the influenza vaccine today. Also, when was your last tetanus shot?

**Patient:** Honestly, I don't remember — it's been a long time.

**Doctor:** Then let's give you a Tdap booster today too, since it's likely
been over ten years.

*(Vaccines administered)*

**Doctor:** Alright, so to summarize — my diagnosis today is hypertension,
currently well-controlled, and hyperlipidemia. Given your father's history
of coronary artery disease, cardiovascular risk is something we'll keep an
eye on, but nothing acute today.

**Doctor:** For the plan — keep taking the lisinopril and atorvastatin as
prescribed. I'd like to order a repeat lipid panel in three months to see
how your cholesterol is trending. Let's schedule a follow-up in three
months to go over those results. No referrals needed right now, but we'll
revisit that if anything changes. In the meantime, focus on a
low-sodium, heart-healthy diet and try to get in some regular exercise
each week.

**Patient:** Sounds good, thank you!

**Doctor:** Great to have you as a patient — see you in three months.

---

## What this should fill

| Section | Component | Expected auto-filled items |
|---|---|---|
| Subjective | Chief Complaint | Main complaint (routine annual physical), Onset (longstanding / ~2 years), Severity (Mild) |
| Subjective | Past Medical History | Cardiovascular (Hypertension), Endocrine (Hyperlipidemia) |
| Subjective | Past Surgical History | General (Appendectomy, Cholecystectomy) |
| Subjective | Social History | Marital Status (Married), Tobacco (never smoked), Alcohol (weekly), Education Level (Graduate), Employment (Teacher) |
| Subjective | Family History | Mother (Diabetes Mellitus, Hypertension), Father (Coronary Artery Disease) |
| Subjective | Allergies | Penicillins (Rash), Shellfish (Hives) |
| Subjective | Current Medications | Medication List (Lisinopril 10mg daily, Atorvastatin 20mg daily) |
| Objective | Vitals | Height, Weight, Temperature, Pulse, Respiratory Rate, Blood Pressure Sys/Dia, O2 Saturation |
| Objective | Physical Exam | General Appearance, HEENT, Cardiovascular, Respiratory, Abdomen, Musculoskeletal, Neurological, Skin |
| Objective | Laboratory Results | CBC, CMP, Lipid Panel (elevated), Hemoglobin A1c, TSH, Urinalysis |
| Objective | Diagnostic Imaging | (intentionally none — script explicitly says no imaging needed) |
| Objective | Point-of-Care Testing | EKG (12-Lead), Fingerstick Glucose |
| Objective | Immunizations Administered | Influenza Vaccine, Tdap Vaccine |
| Assessment | Assessment | Diagnosis (Hypertension, Hyperlipidemia), Risk Factors (Family History) |
| Plan | Plan | Follow-Up (3 months), Order Labs (Lipid Panel), Additional Plan Notes (diet/exercise counseling) |

If a row doesn't fill after a full read-through, check the ActionBridge
Transcript tab to confirm Corti actually captured that line correctly
before assuming the AI parser missed it.
