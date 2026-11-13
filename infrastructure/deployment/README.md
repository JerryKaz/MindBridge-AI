# Deployment guide

The stack is three deployables plus a database:

| Component | Artifact | Suggested hosting |
| --- | --- | --- |
| API | `infrastructure/docker/api.Dockerfile` | Any container host (Render, Railway, Fly.io, a VPS with Docker) |
| Admin dashboard | `infrastructure/docker/admin.Dockerfile` (static files behind nginx) | Same container host, or any static host using `apps/admin/dist` |
| Mobile app | Expo / EAS Build | Google Play / App Store (internal testing tracks first) |
| Database | MongoDB 7+ | MongoDB Atlas (choose a region close to Ghana, e.g. EU/Africa) |

## Production checklist

- [ ] HTTPS everywhere (terminate TLS at the platform/load balancer). Set `TRUST_PROXY=1` behind one proxy.
- [ ] Secrets only in the platform's secret store: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, `AI_API_KEY`, SMTP credentials.
- [ ] Back up `FIELD_ENCRYPTION_KEY` securely — without it, encrypted messages and journals cannot be read.
- [ ] `CORS_ORIGINS` set to the exact admin dashboard origin.
- [ ] MongoDB: dedicated least-privilege user (readWrite on the app database only), IP allow-list / private networking, encryption at rest and backups enabled.
- [ ] Run `pnpm --filter @mindbridge/api seed` once, then create the first admin with `create-admin`.
- [ ] Add and **verify** support resources (campus counselling units, emergency and crisis contacts) in the dashboard before launch.
- [ ] Have a qualified mental-health professional review the wellness content, crisis copy (`apps/api/src/modules/intelligence/safety-pathway.ts`) and the safety test cases.
- [ ] Choose an AI provider whose terms prohibit training on your API data; record a data-processing agreement.
- [ ] Legal/privacy review under Ghana's Data Protection Act, 2012 (Act 843), including registration with the Data Protection Commission.
- [ ] Monitoring: `/health` endpoint, error logs (pino JSON), and the admin "safe-fallback rate" metric.

## Mobile release

```bash
cd apps/mobile
npx eas build --platform android --profile preview   # requires an Expo account (eas login)
```
Set `EXPO_PUBLIC_API_URL` to the HTTPS API URL in the EAS build profile.
