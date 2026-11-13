# @mindbridge/api

Express 5 + Mongoose REST API (`/api/v1`) with the MindBridge AI orchestration pipeline.

```bash
cp .env.example .env          # fill in secrets (see comments in the file)
pnpm --filter @mindbridge/api seed
ADMIN_PASSWORD='choose-a-strong-one-123' pnpm --filter @mindbridge/api create-admin -- you@example.com "Your Name"
pnpm dev:api                  # from the repo root
```

| Script | Purpose |
| --- | --- |
| `dev` | Watch mode with `tsx` |
| `build` / `start` | Compile to `dist/` and run |
| `test` | Unit + HTTP tests; integration tests run when `TEST_MONGODB_URI` is set |
| `seed` | Universities + starter wellness activities (no support resources — those must be verified by an admin) |
| `create-admin` | Create/promote an admin (password via `ADMIN_PASSWORD`) |
| `eval:safety` | Recall / false-positive report for the safety engine on the synthetic dataset |

Module layout: `src/modules/<module>/{*.model,*.service,*.routes}.ts`; AI pipeline in `src/modules/intelligence`.
See `/docs` for architecture, database, API and AI-safety documentation.
