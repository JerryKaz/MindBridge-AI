# @mindbridge/api

Express 5 + Mongoose REST API (`/api/v1`) with the MindBridge AI orchestration pipeline.

```bash
pnpm setup:env               # from the repo root: creates .env with generated secrets
pnpm seed                    # from the repo root
pnpm dev:api                  # from the repo root
```

| Script | Purpose |
| --- | --- |
| `dev` | Watch mode with `tsx` |
| `build` / `start` | Compile to `dist/` and run |
| `test` | Unit + HTTP tests; integration tests run when `TEST_MONGODB_URI` is set |
| `seed` | Universities, starter wellness activities and the support directory from `src/scripts/support-resources.ts` |
| `eval:safety` | Recall / false-positive report for the safety engine on the synthetic dataset |

Module layout: `src/modules/<module>/{*.model,*.service,*.routes}.ts`; AI pipeline in `src/modules/intelligence`.
See `/docs` for architecture, database, API and AI-safety documentation.
