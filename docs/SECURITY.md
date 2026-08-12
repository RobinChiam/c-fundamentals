# Security

## Threat model

The Learning Lab is a **local-first single-user educational application**. It is **not designed as a public multi-user remote code execution service**.

Assumptions:

- One learner on their own machine
- Default bind address is loopback (`127.0.0.1`)
- No authentication (not required for local-only use)
- Learner code is untrusted but execution is constrained

## Compiler trust boundary

- GCC invoked with argument arrays and `shell: false`
- No client-supplied compiler path or flags
- Trusted lesson manifest defines source files and link flags
- Byte, output, and timeout limits
- Temp workspaces cleaned after each compile
- Compiled binaries are not executed on the host

## Runner sandbox

Learner programs run only inside Docker containers using the pinned image `gcc:15.3.0-trixie`:

- No Docker socket mounted into learner containers
- Repository is not mounted into learner containers
- Network disabled (`--network none`)
- Read-only root, ephemeral writable sandbox
- CPU/memory/PID limits, non-root user, capabilities dropped
- Containers named with app prefixes for ownership tracking

The sandbox reduces risk for local learning but **does not guarantee perfect isolation**.

## Labs

- Hidden test harness source stays server-side
- Hidden tests and expected values are not exposed to the client
- Evaluation reuses the Docker sandbox
- Solution files require explicit reveal and are not auto-copied into drafts

## Architecture explorer

- Only manifest-approved lesson files
- No arbitrary filesystem path API
- Conservative static analysis (not a full arbitrary-code executor)

## Database privacy

SQLite stores local learner drafts and progress under `.data/`. This data is not transmitted to third parties by the application.

## External binding warning

Binding to non-loopback addresses is possible via `LEARNING_APP_HOST` but unsupported without additional network and access controls. Startup prints a visible warning.

## Production HTTP hardening

Production mode adds security headers (including CSP compatible with Monaco/xterm), finite body/request limits, sanitized API error messages (no stack traces or absolute paths in browser responses), and no wildcard CORS on execution endpoints.

## Dependency review

Run `pnpm audit` from `learning-app/` before release. Production server dependencies should remain free of unresolved HIGH/CRITICAL advisories. Transitive client-only advisories (for example Monaco's bundled DOMPurify) are tracked separately and mitigated by the local-only threat model plus CSP.

## What the sandbox does NOT guarantee

- Protection against all kernel or Docker daemon vulnerabilities
- Safe multi-tenant public hosting
- Confidentiality if you intentionally expose the server broadly
