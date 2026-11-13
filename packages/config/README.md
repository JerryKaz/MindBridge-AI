# @mindbridge/config

Shared TypeScript configuration. Extend from app `tsconfig.json` files:

- `tsconfig.base.json` — strict compiler defaults shared by every package
- `tsconfig.node.json` — Node.js ESM (API, shared package)
- `tsconfig.react.json` — bundler-resolved React (for a future web client)
