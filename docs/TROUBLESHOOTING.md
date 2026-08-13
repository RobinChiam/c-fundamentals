# Troubleshooting

## Install issues

### Node or pnpm version

Requires Node >= 22 and pnpm 9.x (see `learning-app/package.json` `packageManager` field).

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

## Port already in use

Default port is `3001`. Override:

```bash
LEARNING_APP_PORT=3002 pnpm start
```

Ensure the port is valid (1–65535).

## GCC unavailable

Compile shows **GCC unavailable** when `gcc --version` fails on the host.

- Install GCC (Linux: `gcc` package; Windows: MinGW-w64/MSYS2)
- Restart the server after installing

Editing and persistence still work without GCC.

## Docker unavailable

Run and lab tests require Docker CLI and a running daemon.

Common states:

| Symptom | Likely cause |
|---------|----------------|
| Docker CLI missing | Install Docker Engine / Docker Desktop |
| Daemon stopped | Start Docker service |
| Image missing | `docker pull gcc:15.3.0-trixie` |

Core E2E tests do not require Docker.

## Runner image missing

```bash
docker pull gcc:15.3.0-trixie
```

This is an explicit setup step, not a hidden runtime download during Run.

## Persistence unavailable

If SQLite cannot open, the app degrades gracefully (editing may work; saves may not persist).

Check:

- Write permission to `learning-app/.data/`
- Disk space
- File not locked by another process

Do **not** delete the learner database as a first troubleshooting step.

## Monaco or browser issues

- Use a current Chromium, Firefox, or WebKit browser
- Disable extensions that block workers if Monaco fails to load
- Hard refresh after upgrades (`Ctrl+Shift+R`)

## Playwright browser installation

```bash
cd learning-app
pnpm exec playwright install --with-deps
pnpm test:e2e
```

## Compile: Permission denied on the source file

Raw compiler output like:

```
cc1: fatal error: shapes.c: Permission denied
```

means the Docker sandbox could not read the temporary workspace. This is not a C syntax error.

The sandbox drops all Linux capabilities, so container processes cannot open the default `0700` temp directory. Current versions chmod that workspace before compile. Restart the learning-app server after upgrading, then Run again.

## Compiler/run busy

If many compile/run/lab requests overlap, the server returns HTTP 429. Wait and retry.

## Safe recovery

1. Stop the server (Ctrl+C) and wait for graceful shutdown
2. Restart with `pnpm start`
3. Check Docker for stale app containers: `docker ps -a --filter name=cfund-`

Only remove containers with the `cfund-` prefix owned by this application.
