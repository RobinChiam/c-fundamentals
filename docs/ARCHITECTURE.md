# Architecture

## Overview

The Learning Lab is a pnpm workspace with three packages:

```
client (React/Vite)
    ↕ HTTP /api
server (Fastify)
    ↕ filesystem / child processes / Docker
curriculum (repository C lessons)
shared (TypeScript contracts)
```

Production mode serves the built client and API from one Fastify process on loopback.

## Major layers

### Client

React SPA with React Router. Major surfaces:

- Curriculum dashboard and lesson reader
- Monaco code workspace (edit/compare)
- Compile and Run panels
- Labs (tests, hints, solution reveal)
- Searching/sorting and Part 10 memory/control-flow visualizers
- Architecture explorer (Lessons 12 and capstone)

### Server

Fastify application registering route modules:

- Curriculum and lesson file APIs
- Compiler service (host GCC, ephemeral temp workspaces)
- Runner service (Docker sandbox for compile+run)
- Lab service (hidden harness evaluation via same sandbox)
- Persistence (SQLite drafts/progress/lab state)
- Architecture service (manifest-approved static analysis)

### Shared

Zod-validated request/response schemas used by client and server.

### Curriculum

Repository lesson folders and manifest. The app reads approved files only; it does not execute curriculum sources on the host outside controlled services.

## Trust boundaries

| Boundary | Server-side enforcement |
|----------|-------------------------|
| Compile | Trusted manifest build specs; `spawn` with `shell: false`; byte/time limits |
| Run | Learner binaries never run on host; Docker with pinned image, no network, dropped caps |
| Labs | Hidden harness and tests are server-owned; client cannot supply hidden expectations |
| Architecture | Manifest-approved files only; conservative static analysis |
| Solutions | Generic solution API restricted; deliberate reveal required |
| Persistence | Local SQLite; no remote sync |

## Execution capacity

Finite server-side gates limit concurrent GCC compiles and Docker sandbox work (Run + lab evaluation share the sandbox gate). Busy requests return HTTP 429.

## Shutdown

SIGINT/SIGTERM triggers bounded cleanup: stop accepting work, terminate app-owned compiler processes, remove app-owned Docker containers, close SQLite, close Fastify.
