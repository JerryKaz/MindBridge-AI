# API documentation

Base URL: `/api/v1`. JSON in and out. Authenticated routes need `Authorization: Bearer <accessToken>`.

Errors always look like:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields need attention", "details": [{ "path": "email", "message": "Enter a valid email address" }] } }
```
Common codes: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `FORBIDDEN` / `CONSENT_REQUIRED` / `ACCOUNT_DEACTIVATED` 403, `NOT_FOUND` 404 (also used for resources you do not own), `CONFLICT` 409, `PAYLOAD_TOO_LARGE` 413, `RATE_LIMITED` 429.

Rate limits: 300 req/min/IP overall; 20 auth attempts per 15 min/IP; 15 chat messages/min/student.

## Authentication
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ email, password, displayName, acceptedTerms: true }` | 201 `{ user, tokens }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, tokens }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ tokens }` (rotates; reuse revokes the session family) |
| POST | `/auth/logout` | `{ refreshToken }` | 204 |
| POST | `/auth/forgot-password` | `{ email }` | 202 (same response whether or not the account exists) |
| POST | `/auth/reset-password` | `{ token, password }` | 204 (revokes all sessions) |

`tokens = { accessToken, refreshToken, expiresIn }`. Passwords: ≥10 chars with a letter and a number.

## Students & universities
| GET | `/students/me` | | `StudentProfile` |
| --- | --- | --- | --- |
| PUT | `/students/me` | `{ displayName?, universityId?, yearOfStudy?, onboardingCompleted? }` | `StudentProfile` |
| GET | `/universities` | public | `University[]` |

## Conversations
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/conversations` | `{ title? }` → 201 `ConversationSummary` |
| GET | `/conversations` | Own conversations, newest first |
| GET | `/conversations/:id` | `ConversationDetail` with up to 200 messages |
| DELETE | `/conversations/:id` | Hard delete incl. derived AI/safety records |
| POST | `/conversations/:id/messages` | `{ content }` (1–2000 chars). Requires `AI_PROCESSING` consent. → 201 `SendMessageResponse` |

`SendMessageResponse`:
```json
{
  "studentMessage": { "id": "…", "role": "student", "content": "…", "createdAt": "…" },
  "reply": {
    "id": "…", "role": "assistant", "content": "…", "createdAt": "…",
    "suggestions": ["Tell me more"],
    "safety": { "level": "ELEVATED_CONCERN", "resources": [ /* verified SupportResource[] */ ] }
  },
  "trace": {
    "intent": { "label": "ACADEMIC_STRESS", "confidence": 0.82 },
    "signals": [{ "signal": "STRESS", "score": 1 }],
    "safety": { "level": "STANDARD", "sources": [] },
    "strategy": "EMOTIONAL_VALIDATION",
    "validation": { "passed": true, "issues": [], "usedFallback": false },
    "provider": "anthropic",
    "latencyMs": 812
  }
}
```

## Mood tracking
| POST | `/moods` | `{ mood, intensity?: 1-5, journal?, recordedAt? }` → 201 `MoodEntry` |
| --- | --- | --- |
| GET | `/moods/history?range=week\|month\|quarter` | `{ entries, distribution, daily, insights }` |
| DELETE | `/moods/:id` | 204 |

## Wellness & support
| GET | `/wellness/activities?category=` | Published activities |
| --- | --- | --- |
| GET | `/wellness/activities/:id` | |
| POST | `/wellness/activities/:id/complete` | Anonymous completion counter |
| GET | `/support/resources?category=&universityId=` | VERIFIED + published only; emergency first, then the student's campus |
| GET | `/support/resources/:id` | |

## Privacy
| GET | `/consents` | All consent types with current state |
| --- | --- | --- |
| PUT | `/consents` | `{ consents: [{ type, granted }] }` (history is kept) |
| GET/POST | `/memories` | Requires `CONVERSATION_MEMORY` consent to add (max 20) |
| DELETE | `/memories/:id` | |
| POST | `/privacy/data-export` | Full JSON export (decrypted) |
| POST | `/privacy/account-deletion` | `{ password, confirm: "DELETE" }` → 204, hard delete |

`GET /health` (outside `/api/v1`) → `{ status, db, aiProvider }`, 503 when the database is down.

Full request/response types: `packages/shared/src/types.ts`; validation: `packages/shared/src/schemas/*`.
