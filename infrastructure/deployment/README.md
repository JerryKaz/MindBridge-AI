# Deployment guide

The stack is three deployables plus a database:

| Component | Artifact | Suggested hosting |
| --- | --- | --- |
| API | `infrastructure/docker/api.Dockerfile` | Any container host (Render, Railway, Fly.io, a VPS with Docker) |
| Mobile app | Expo / EAS Build | Google Play / App Store (internal testing tracks first) |
| Database | MongoDB 7+ | MongoDB Atlas (choose a region close to Ghana, e.g. EU/Africa) |

## Production checklist

- [ ] HTTPS everywhere (terminate TLS at the platform/load balancer). Set `TRUST_PROXY=1` behind one proxy.
- [ ] Secrets only in the platform's secret store: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, `AI_API_KEY`, SMTP credentials.
- [ ] Back up `FIELD_ENCRYPTION_KEY` securely — without it, encrypted messages and journals cannot be read.
- [ ] `CORS_ORIGINS` limited to origins you actually serve a web client from (the native mobile app does not need CORS).
- [ ] MongoDB: dedicated least-privilege user (readWrite on the app database only), IP allow-list / private networking, encryption at rest and backups enabled.
- [ ] Add **verified** support resources (campus counselling units, emergency and crisis contacts) to `apps/api/src/scripts/support-resources.ts`, then run `pnpm seed`. Re-run it whenever that file changes.
- [ ] Have a qualified mental-health professional review the wellness content, crisis copy (`apps/api/src/modules/intelligence/safety-pathway.ts`) and the safety test cases.
- [ ] Choose an AI provider whose terms prohibit training on your API data; record a data-processing agreement.
- [ ] Legal/privacy review under Ghana's Data Protection Act, 2012 (Act 843), including registration with the Data Protection Commission.
- [ ] Monitoring: `/health` endpoint, error logs (pino JSON), and the safe-fallback rate (share of `aiInteractions` with `usedFallback`).

## Mobile release

```bash
cd apps/mobile
npx eas build --platform android --profile preview   # requires an Expo account (eas login)
```
Set `EXPO_PUBLIC_API_URL` to the HTTPS API URL in the EAS build profile.
