# C Fundamentals Learning Lab — Application Foundation

Part 1 of the learning application: a minimal pnpm workspace with a React + Vite frontend, Fastify backend, and shared TypeScript contracts.

## Requirements

- Node.js >= 22
- pnpm

## Commands

From this directory:

```bash
pnpm install
pnpm dev        # start client and server in development
pnpm typecheck  # run TypeScript checks in all packages
pnpm test       # run tests in all packages
pnpm build      # build all packages
```

## Packages

| Package | Description |
|---------|-------------|
| `client/` | React + Vite frontend shell |
| `server/` | Fastify API (`GET /api/health`) |
| `shared/` | Shared types and schemas used by client and server |

During development, the Vite dev server proxies `/api/*` requests to the backend so the frontend does not need a hard-coded production URL.
