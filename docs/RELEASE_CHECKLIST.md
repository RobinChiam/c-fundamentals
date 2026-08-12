# Release Checklist

Repeatable checks from a clean checkout.

## Install

```bash
cd learning-app
pnpm install --frozen-lockfile
```

## Quality

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:e2e
```

## C curriculum (repository root)

```bash
make clean
make all
make solutions
```

## Security

- [ ] `pnpm audit` reviewed (document any accepted transitive client-only findings)
- [ ] No SQLite/WAL/SHM files tracked
- [ ] No solution source leaked via API
- [ ] No host learner binary execution
- [ ] No stale `cfund-*` containers after integration tests

## Manual smoke test

```bash
cd learning-app
pnpm start
```

Verify on `http://127.0.0.1:3001`:

- [ ] Dashboard
- [ ] Deep lesson URL + reload
- [ ] Lab URL
- [ ] Visualizer routes
- [ ] Architecture explorer (Lessons 12 / capstone)
- [ ] API `/api/health`
- [ ] Persistence across restart
- [ ] Compile (if GCC available)
- [ ] Run (if Docker + image available)
- [ ] Keyboard navigation (skip link, tabs, dialogs)
- [ ] 200% zoom on major pages

## Shutdown

Send SIGINT to running server and confirm clean exit without orphaned app-owned containers.
