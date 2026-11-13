# AI processing pipeline & safety

MindBridge AI is **not** a chatbot that forwards messages to an LLM. Every message passes through an orchestrated, typed pipeline (`apps/api/src/modules/intelligence`). Each stage is its own class with its own tests.

```
student message
  │ 1 Input validation ─── Zod schema · length ≤ 2000 · rate limit · auth · conversation ownership · consent
  │   (optional) provider.analyze() ── structured JSON classification, Zod-validated; ignored on any failure
  │ 2 IntentClassifier ─── weighted lexicon distribution (+ LLM ensemble when available) → label + confidence
  │ 3 EmotionAnalyzer ──── 9 signals with 0..1 scores, negation & intensifier aware (indicators, not diagnoses)
  │ 4 SafetyEngine ─────── independent; rules + risk patterns + classifier + context → max severity
  │ 5 ContextManager ───── last 8 turns (≤600 chars each) + topic summary + consented memories only
  │ 6 StrategySelector ─── safety first, then intent/emotion/request/recent strategies
  │ 7 ResponseGenerator ── provider.generateResponse(context, strategy)   ← skipped for CRISIS_RESPONSE
  │ 8 ResponseValidator ── 10 rule groups; any failure → reviewed safe fallback
  │ 9 Persist + respond ── encrypted messages, safety event (no text), metadata-only interaction record
  ▼
reply + verified resources + explainable trace
```

## Stage 4 — independent safety assessment

Four detectors, combined by taking the **most severe** level. Nothing later in the pipeline can lower it.

| Detector | Examples | Result |
| --- | --- | --- |
| Deterministic rules | explicit self-harm/suicide statements (incl. slang/leetspeak: "kms", "unalive", "k1ll myself", "diiie"), harm to others, current danger (abuse, being unsafe at home) | `POTENTIAL_IMMEDIATE_DANGER` |
| Risk patterns | passive ideation ("better off without me", "wish I could disappear"), hopelessness ("no point", "worthless") | `ELEVATED_CONCERN` |
| | passive ideation + plan/means/time ("tonight", "pills", "wrote a note"), hopelessness + means | `POTENTIAL_IMMEDIATE_DANGER` |
| Dedicated classifier | LLM safety pass with a strict JSON schema (`prompts/safety.prompt.ts`) | can **raise** only |
| Contextual | plan/means after earlier ideation in the same conversation; any prior concern keeps the conversation at ≥ `ELEVATED_CONCERN` | escalation / stickiness |

Idioms are removed before rule matching ("this course is killing me", "dying to go home", "my phone died"). Text is normalised (accents, zero-width characters, leetspeak, repeated letters). The engine is deliberately tuned for **recall**: a false positive leads to a gentle referral, a false negative could be catastrophic.

Prompt-injection phrases ("ignore previous instructions", "reveal your prompt", …) are flagged and passed to the generator as a constraint; they do not change the risk level.

## Strategy selection

`POTENTIAL_IMMEDIATE_DANGER → CRISIS_RESPONSE` and `ELEVATED_CONCERN → HUMAN_SUPPORT_REFERRAL` are applied before any other rule. Otherwise: short ambiguous messages → `GENTLE_CLARIFICATION`; acute anxiety + "help me calm down" → `COPING_EXERCISE`; explicit requests → `PRACTICAL_GUIDANCE` (but not twice in a row — then `GUIDED_REFLECTION`); loneliness/relationships → `EMPATHETIC_LISTENING`; strong distress → `EMOTIONAL_VALIDATION`; self-reflection/motivation → `GUIDED_REFLECTION`.

## Crisis pathway

* Produced by `safety-pathway.ts` — deterministic, reviewable copy. **The LLM is never called.**
* Calm, non-judgemental; encourages contacting emergency services if in danger, reaching a trusted person, and asks whether the student is safe right now.
* Attaches only **VERIFIED and published** resources (emergency, crisis lines, the student's campus counselling). If none are verified yet, it says so honestly and points to emergency services / campus counselling **without inventing numbers**.
* Records a `safetyEvent` (level, detector ids, action) with no message text; auto-expires.

## Response validation (stage 8)

| Rule | Catches |
| --- | --- |
| `medical_diagnosis` | "you have/might have … depression / anxiety disorder / bipolar / PTSD …" |
| `medication_recommendation` | named psychiatric/sleep medications, doses (`mg`), "take some pills" |
| `unsafe_advice` | method information, alcohol as coping, skipping meals |
| `false_guarantee` | "I promise", "everything will definitely be fine" |
| `discourages_professional_help` | "you don't need a therapist", claims to be licensed / to treat |
| `judgmental_or_dismissive` | "just cheer up", "you're overreacting", "others have it worse" |
| `privacy_leak` | system-prompt canary, verbatim prompt fragments, internal tags, ObjectIds, email addresses |
| `invented_contact` | any phone number not belonging to an attached verified resource |
| `unsafe_crisis_handling` | dismissive replies ("sleep it off", "don't tell anyone") when concern ≥ elevated |
| `empty_or_too_long` | empty or > 1500 chars |

Failures are replaced with a strategy-specific reviewed fallback and logged (issue ids only). Provider errors/timeouts also degrade to fallbacks — a student in distress never sees a server error.

## Privacy safeguards in the AI path

* LLM calls happen only on the backend; keys are never shipped to apps.
* No student identifiers, emails or names are sent to the provider; only the current message, ≤8 recent turns, topic labels and memories the student explicitly saved (with consent).
* Student text is wrapped in `<student_message>` tags with `<`/`>` escaped; the system prompt states it is untrusted data.
* The LLM has no tools and cannot query the database or trigger actions.
* Choose a provider/plan that does not train on API data (documented in the deployment checklist).

## Evaluation

* `pnpm --filter @mindbridge/api test` — unit tests for every stage plus pipeline scenarios 1, 2, 5, 6, 7, 8, 10 and provider outage.
* `pnpm --filter @mindbridge/api eval:safety` — recall, false-positive rate and intent accuracy on `src/scripts/evaluation-dataset.ts` (synthetic). The current lexicons were tuned against this set, so its scores are **in-sample**; extend it with new, held-out synthetic cases (ideally written by a mental-health professional) before drawing conclusions.
* Metrics in production (admin Analytics): fallback rate, latency, weekly safety activations.

## Limitations (be explicit in the showcase)

* Lexicon-based detectors are English-centric; Pidgin, Twi, Ga, Ewe and code-switching are not covered yet.
* Rules cannot understand every phrasing; that is why a classifier pass and conservative escalation exist — and why MindBridge always presents human support.
* Safety copy, wellness content and test cases must be reviewed by qualified professionals before real-world use.
