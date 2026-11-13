# CI

`github-actions-ci.yml` is the GitHub Actions pipeline (typecheck, unit/HTTP tests, MongoDB integration tests via a service container, safety evaluation, API/admin builds, mobile bundle check).

Activate it by moving it into place:

```bash
mkdir -p .github/workflows
git mv infrastructure/ci/github-actions-ci.yml .github/workflows/ci.yml   # or move it manually
```
