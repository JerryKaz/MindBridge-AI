# @mindbridge/admin

Admin dashboard — React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui components + Recharts.

```bash
cp .env.example .env   # VITE_API_URL
pnpm dev:admin         # from the repo root → http://localhost:5173
```

Sign in with an account created by `pnpm --filter @mindbridge/api create-admin`. Student accounts are rejected.

Pages: Overview · Students (status only) · Wellness content · Support resources (with verification workflow) · Analytics (aggregated, small groups suppressed) · Audit log.
There is no screen — and no API — for reading student conversations, journals or individual mood histories.
