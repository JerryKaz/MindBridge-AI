# Database design (MongoDB)

All collections have `createdAt`/`updatedAt` timestamps (append-only ones have `createdAt` only). Ownership is enforced **in queries** (`{ _id, student }`), so a foreign id behaves exactly like a missing one (404).

Fields ending in `Enc` hold AES-256-GCM ciphertext (`v1:<iv>:<tag>:<data>`).

| Collection | Purpose | Key fields | Indexes | Retention |
| --- | --- | --- | --- | --- |
| `users` | Students | email (unique), passwordHash (Argon2id, `select:false`), displayName, status, university?, yearOfStudy?, onboardingCompleted, lastActiveAt, passwordReset{tokenHash, expiresAt} | `email` unique; `status,createdAt`; `university`; `lastActiveAt` | Until account deletion |
| `refreshTokens` | Session rotation / revocation | user, tokenHash (SHA-256), family, expiresAt, revokedAt, replacedBy | `tokenHash` unique; `user,family`; TTL on `expiresAt` | Auto-expires |
| `universities` | Optional profile selection | name (unique), shortName, city, active | `name` unique; `active,name` | Reference data |
| `conversations` | Chat sessions | student, title (topic-based, not message text), lastMessagePreviewEnc, messageCount, recentTopics[intent], highestSafetyLevel, lastMessageAt | `student,updatedAt` | Until the student deletes it / the account |
| `messages` | Chat turns | conversation, student, role, contentEnc, safetyLevel, strategy, resourceIds, suggestions | `conversation,createdAt`; `student,createdAt` | Deleted with conversation |
| `moodEntries` | Check-ins | student, mood, intensity?, journalEnc?, recordedAt | `student,recordedAt`; `recordedAt,mood` (aggregates) | Until deleted |
| `studentMemories` | Notes the student asked MindBridge to use | student, contentEnc | `student,createdAt` | Until deleted (max 20) |
| `consents` | Consent state + history | student, type, granted, policyVersion, history[] | `student,type` unique | With account |
| `wellnessActivities` | Guided activities | title, description, category, durationMinutes, instructions[], reviewStatus, reviewedBy, published, completions | `published,category,title` | Content |
| `supportResources` | Human support directory | name, category, description, university?, phone/email/website, location, region, availability, isFree, verificationStatus, verificationSource, verifiedAt, verifiedBy, published, views | `verificationStatus,published,category`; `university,verificationStatus` | Content |
| `safetyEvents` | That the safety pathway activated | student, conversation, level, sources (detector ids), actionTaken — **no message text** | `student,createdAt`; `level,createdAt`; TTL `createdAt` | `SAFETY_EVENT_RETENTION_DAYS` (default 90) |
| `aiInteractions` | Pipeline metadata for evaluation | conversation, intent, confidence, signals, safetyLevel, strategy, provider, validation, usedFallback, latencyMs — **no text, no student id** | `conversation`; TTL `createdAt` | `AI_INTERACTION_RETENTION_DAYS` (default 30) |

## Relationships

```
users 1─* conversations 1─* messages
users 1─* moodEntries, studentMemories, consents, safetyEvents, refreshTokens
conversations 1─* aiInteractions, safetyEvents
universities 1─* users, supportResources
messages *─* supportResources (resourceIds shown with a reply)
```

## Deletion cascade

* Delete conversation → messages, aiInteractions and safetyEvents for that conversation, then the conversation.
* Delete account → every conversation (as above), moodEntries, studentMemories, consents, safetyEvents, refreshTokens, then the user. A log line records that an erasure happened, without personal data.

## Data minimisation notes

* Conversation titles are derived from the detected topic ("Academic pressure"), never from message text.
* The context manager's "session summary" is the list of topic labels, not a text summary.
* Analytics suppress categorical buckets with fewer than 5 students.
