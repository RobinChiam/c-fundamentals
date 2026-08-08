# Contributing

Thank you for helping improve this C fundamentals curriculum.

## Before you open a pull request

1. Compile with strict warnings from the repository root:
   ```text
   make all
   make solutions
   ```
2. Run the changed program manually if behavior changed (especially input validation or file I/O).
3. Keep each lesson **self-contained** — avoid introducing a shared library that earlier lessons depend on.
4. Match existing style: C17, `-Wall -Wextra -Wpedantic`, `fgets` + parsing for interactive input, and the portable `pause_at_exit` pattern documented in the root [README.md](README.md).

## Lesson layout

Most lessons include:

- `README.md` — objectives, build instructions, exercises
- Primary `.c` file — teaching demo
- `solution.c` — reference solution for exercises

Multi-file lessons (Header Files, Intermediate Console Project) document the full `gcc` command in their README.

## Folder names with spaces

Lesson directories use Title Case names with spaces. Quote paths in shell commands, or use the root `Makefile` which handles them for compile-smoke checks.

## What to avoid

- `system("pause")` — use the portable Enter-wait helper instead
- Unbounded `scanf("%s", ...)` into fixed buffers
- Committing `build/`, `*.exe`, `*.o`, or generated data files (`tasks.txt`, `sample_data.txt`)

## Suggested improvements

Bug fixes, clearer comments, additional exercises, and compile/CI improvements are welcome. Open an issue first for large structural changes (new lessons, renaming folders, or replacing the per-lesson helper duplication with a shared library).
