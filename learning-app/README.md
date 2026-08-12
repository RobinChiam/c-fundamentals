# C Fundamentals Learning Lab

Local-first web application for the C Fundamentals curriculum: dashboard, Monaco workspace, GCC compile, Docker-sandboxed run, SQLite persistence, structured labs, visualizers, and architecture explorer.

Designed and tested against **WCAG 2.2 Level AA** criteria (not a formal certification claim).

## Requirements

- Node.js >= 22
- pnpm (see `packageManager` in `package.json`, currently pnpm 9.x)

### Optional capabilities

| Tool | Enables |
|------|---------|
| **GCC** | Compile panel |
| **Docker** | Run panel and lab evaluation |
| **Runner image** `gcc:15.3.0-trixie` | Sandboxed execution (`docker pull gcc:15.3.0-trixie`) |

## Install

```bash
pnpm install --frozen-lockfile
```

## Development

```bash
pnpm dev
```

Vite serves the client and proxies `/api/*` to the Fastify server on `http://127.0.0.1:3001`.

## Build and production

```bash
pnpm build
pnpm start
```

Production serves the built React app and API from a **single Fastify process** on loopback (`127.0.0.1:3001` by default).

Environment variables:

| Variable | Purpose |
|----------|---------|
| `LEARNING_APP_HOST` | Bind host (default `127.0.0.1`) |
| `LEARNING_APP_PORT` | Bind port (default `3001`) |
| `LEARNING_APP_DATABASE_PATH` | SQLite file path |
| `LEARNING_APP_CLIENT_DIST` | Override client `dist/` path |
| `NODE_ENV=production` | Enables production static serving and security headers |

Binding to a non-loopback host prints a warning. External exposure is unsupported without additional security controls.

## Persistence

Learner drafts, progress, lab state, and attempt history are stored under `learning-app/.data/` (ignored by Git). Data survives server restart.

## Testing

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

E2E tests run against the production build on port `4173` with an isolated SQLite database in `.e2e-data/`.

Optional Docker integration tests:

```bash
pnpm test:e2e:docker
```

## Packages

| Package | Role |
|---------|------|
| `client/` | React + Vite frontend |
| `server/` | Fastify API, compiler, runner, labs, persistence |
| `shared/` | Shared TypeScript contracts |

## Documentation

- [Architecture](../docs/ARCHITECTURE.md)
- [Security](../docs/SECURITY.md)
- [Troubleshooting](../docs/TROUBLESHOOTING.md)
- [Release checklist](../docs/RELEASE_CHECKLIST.md)
