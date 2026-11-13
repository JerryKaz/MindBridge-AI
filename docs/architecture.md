# Architecture

## System overview

```
┌──────────────────────┐        HTTPS / JSON         ┌─────────────────────────────────────────────┐
│  Student mobile app  │ ──────────────────────────▶ │  API  (Node.js · Express 5 · TypeScript)    │
│  Expo / React Native │                             │  /api/v1  modular monolith                  │
└──────────────────────┘                             │                                             │
                                                     │  auth · students · universities             │
                                                     │  conversations ─▶ intelligence (AI pipeline)│──▶ LLM provider
                                                     │  moods · wellness · support · privacy       │    (replaceable)
                                                     │                                             │
                                                     └──────────────────────┬──────────────────────┘
                                                                            │ Mongoose
                                                                     ┌──────▼──────┐
                                                                     │   MongoDB   │
                                                                     └─────────────┘
```

* **Monorepo** (pnpm workspaces): `apps/api`, `apps/mobile`, `packages/shared` (Zod schemas, enums and DTO types used by both apps), `packages/config` (TypeScript presets).
* **Modular monolith** API. Each module owns its models, service (business logic) and routes. Controllers are thin route handlers; no business logic in them. Shared concerns live in `src/common` (auth middleware, validation, error handling, rate limiting, crypto, logging).
* **One source of truth for validation:** the same Zod schemas validate forms in the apps and requests in the API.

## Key design decisions

| Decision | Why |
| --- | --- |
| Modular monolith, not microservices | One team, one deployable, simpler ops; module boundaries keep a later split possible. |
| AI pipeline as independent stage classes behind an orchestrator | Each stage is unit-testable; safety cannot be bypassed by changing the generator. |
| `ConversationStore` port for the orchestrator | The pipeline is tested without a database; Mongo is one implementation. |
| Provider abstraction (`AIProvider`) with a rule-based offline provider | Vendor can be swapped by env var; development, CI and outages work without an LLM. |
| Crisis replies are deterministic | Safety-critical copy must be reviewable and must not depend on model behaviour. |
| Application-level AES-256-GCM for message, journal and memory text | Database dumps/backups alone do not reveal what students wrote. |
| Access JWT (15 min) + rotating opaque refresh tokens stored hashed | Short-lived bearer tokens; server-side revocation and reuse detection. |
| No admin panel or admin API; reference data (universities, wellness activities, support directory) is managed in seed files | Nobody can read student data through the app, and there is no privileged account to compromise. |

## Request lifecycle (chat message)

1. `POST /api/v1/conversations/:id/messages` → `requireAuth` → per-student `messageLimiter` → Zod validation (param + body).
2. Consent check (`AI_PROCESSING`).
3. `AIOrchestrator.processMessage` runs the 9 stages (see `ai-safety.md`).
4. Response: `{ studentMessage, reply, trace }`. `trace` is an explainable summary (intent, signals, safety level, strategy, validation result, provider, latency) used by the app's "Show AI insights" view and for the showcase.

## Technologies

API: Node.js 22, Express 5, TypeScript, Mongoose 9, Zod 4, argon2 (Argon2id), jsonwebtoken, helmet, express-rate-limit, pino, nodemailer, Vitest + Supertest.
Mobile: Expo SDK 58, React Native 0.88, Expo Router, TanStack Query, Zustand, React Hook Form + Zod, expo-secure-store.
Tooling: pnpm workspaces, GitHub Actions (with a MongoDB service), Docker.
