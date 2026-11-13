# MindBridge AI

**Your wellbeing. Your space. Your support.**

*Design and Development of MindBridge AI: An Intelligent Student Mental Wellness and Emotional Support Platform* — for university and tertiary students in Ghana.

> MindBridge AI is not a licensed therapist, clinical psychologist, doctor, diagnostic tool or emergency service. It complements, but does not replace, qualified human support.

## What's inside

| Path | What it is |
| --- | --- |
| `apps/api` | Node.js · Express 5 · TypeScript · Mongoose REST API with the 9-stage AI orchestration pipeline |
| `apps/mobile` | Student app — React Native · Expo Router · TanStack Query · Zustand · React Hook Form + Zod |
| `packages/shared` | Zod schemas, enums and API types shared by all apps |
| `packages/config` | Shared TypeScript configuration |
| `docs/` | [Architecture](docs/architecture.md) · [Database](docs/database-design.md) · [API](docs/api-documentation.md) · [AI pipeline & safety](docs/ai-safety.md) |
| `infrastructure/` | Dockerfiles, docker-compose, [deployment checklist](infrastructure/deployment/README.md) |
| `infrastructure/ci/` | GitHub Actions pipeline — move to `.github/workflows/ci.yml` to activate (see its README) |

## Quick start (local)

Prerequisites: Node.js ≥ 20.11, pnpm 10 (`corepack enable`), MongoDB 7+ running locally (or a MongoDB Atlas URI), and Expo Go on a phone or an emulator.

```bash
pnpm install

# 1. API
pnpm setup:env                               # creates apps/api/.env with generated secrets
pnpm seed                                    # universities, wellness activities + support directory
pnpm dev:api                                 # http://localhost:4000/health

# 2. Mobile app (new terminal)
cp apps/mobile/.env.example apps/mobile/.env # set EXPO_PUBLIC_API_URL for your device
pnpm dev:mobile                              # scan the QR code with Expo Go, or press a / i / w
```

Or run MongoDB + API in Docker: `docker compose -f infrastructure/docker/docker-compose.yml up --build`.

### AI provider

`AI_PROVIDER=rule-based` (default) runs fully offline with deterministic, template-based replies — the whole safety pipeline still runs. To use an LLM set:

```
AI_PROVIDER=anthropic            # or openai-compatible (OpenAI, Groq, Together, local vLLM/Ollama …)
AI_API_KEY=...
AI_MODEL=...                     # model id from your provider
AI_BASE_URL=...                  # openai-compatible only
```

### Support resources

There is no admin panel. The support directory is managed in code: add campus counselling units, crisis lines and emergency contacts to `apps/api/src/scripts/support-resources.ts`, recording how and when you verified each one (`verificationSource`, `verifiedOn`), then run `pnpm seed`. Only entries with both fields are shown to students or used by the crisis pathway. The file starts **empty on purpose** — never add a number you have not confirmed. `pnpm seed` warns loudly while the directory is empty, because students in distress would see no human contacts.

## Quality checks

```bash
pnpm typecheck          # all packages
pnpm test               # unit + HTTP tests; MongoDB integration tests run when TEST_MONGODB_URI is set
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/mindbridge_test pnpm --filter @mindbridge/api test
pnpm --filter @mindbridge/api eval:safety
```

## Showcase script

1. **Register & onboard** — mobile app: create an account, read "what MindBridge is and isn't", choose consents, pick a university.
2. **Open the companion** — Home → *Talk to MindBridge*. In *Profile & privacy* turn on **Show AI insights**.
3. **Academic stress** — send *"I'm so stressed, I have two exams and a project due this week"*. Expand *How MindBridge understood this*: intent `academic stress`, signals `stress`, safety `standard`, strategy, validation `passed`.
4. **Strategy changes** — follow with *"How do I manage my time?"* (practical guidance), then *"I'm panicking, help me calm down"* (coping exercise).
5. **Independent safety** — send *"I feel hopeless, what's the point"* → referral with verified resources; in a new conversation, a message indicating immediate danger → deterministic crisis pathway (the LLM is not called; trace provider shows `safety-pathway`).
6. **Validation** — run `pnpm --filter @mindbridge/api test -- ai-orchestrator` to show a generated reply containing a diagnosis/medication being replaced by a safe fallback.
7. **Mood** — Mood tab: check in with intensity and a journal note; switch Week/Month trends.
8. **Human support** — Support tab: verified resources with tap-to-call.

**Simple chatbot vs MindBridge:** a simple chatbot sends the message to an LLM and returns whatever comes back. MindBridge classifies, assesses risk independently (rules + patterns + classifier + context), chooses a response strategy, constrains generation, validates the output, falls back safely, bypasses the LLM entirely in a crisis, and only ever shows verified human contacts.

## Team contributions

| Member | Role | Main contributions |
| --- | --- | --- |
| *(name)* | | |
| *(name)* | | |

## Before real-world use

Professional review of safety copy, wellness content and test scenarios; legal/privacy review under Ghana's Data Protection Act, 2012 (Act 843); verified support resources; a provider agreement that excludes training on student data. See [deployment checklist](infrastructure/deployment/README.md).
