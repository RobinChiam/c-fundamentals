# Lesson 14: Intermediate Console Project

**Difficulty:** Intermediate (capstone)  
**Prerequisites:** Lessons 11–13 (dynamic memory, multi-file builds, searching/sorting), plus structures, enums, and file I/O

## Learning objectives

- Build a menu-driven console application from multiple source files
- Model domain data with `struct` and `enum`
- Keep clear function responsibilities across modules
- Store tasks in a growable dynamic array
- Search and sort tasks
- Persist tasks to a text file (save/load) with error handling
- Validate input and clean up memory/files correctly

## Project layout

| File | Role |
|------|------|
| `main.c` | Menu loop and user actions |
| `task.h` / `task.c` | `Task` struct, status/priority enums, compare/parse helpers |
| `store.h` / `store.c` | Growable list, add/remove/search/sort, save/load |
| `util.h` / `util.c` | `fgets` helpers, range parsing, pause-at-exit |
| `solution.c` | Enhancement demo: filter by status (+ priority counts) |

## Concepts

This lesson is intentionally a **combination** of earlier skills:

- **Dynamic storage:** `realloc`-grown `Task` array inside `TaskStore`
- **Search:** linear find by id / title substring
- **Sort:** insertion sort by priority (high first)
- **Persistence:** one task per line — `id|status|priority|title`
- **Validation:** reject empty titles and `|` characters that would break the file format

## Build and run

Full task tracker:

```text
gcc -std=c17 -Wall -Wextra -Wpedantic main.c task.c store.c util.c -o task_tracker.exe
task_tracker.exe
```

Enhancement / exercise demo (`solution.c`):

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c task.c store.c util.c -o solution.exe
solution.exe
```

Run from this lesson directory so `tasks.txt` is created beside the sources.

## How to use the menu

1. **List tasks** — print the current in-memory list  
2. **Add task** — title, optional status (`todo`/`doing`/`done`), optional priority (`low`/`medium`/`high`)  
3. **Remove task by id**  
4. **Find by id**  
5. **Find title contains** — first substring match  
6. **Sort by priority** — high → medium → low  
7. **Save to file** — writes `tasks.txt`  
8. **Load from file** — replaces the in-memory list  
9. **Update status**  
0. **Quit** — optional save prompt, then frees memory

On startup the program attempts to load `tasks.txt` automatically.

## Example I/O

```text
=== Lesson 14: Intermediate Console Project ===
Task Tracker (educational). Default file: tasks.txt
No existing save loaded (starting empty).

======== Task Tracker ========
1) List tasks
2) Add task
...
0) Quit
Choice: 2
Title: Finish lesson 14
Status (todo/doing/done) [todo]: doing
Priority (low/medium/high) [medium]: high
Added task id 1.

Choice: 1
ID   STATUS   PRIORITY TITLE
--   ------   -------- -----
1    doing    high     Finish lesson 14

Choice: 7
Saved 1 task(s) to tasks.txt.
```

## Common mistakes

- Compiling only `main.c` (undefined references to store/task/util)
- Forgetting `store_free` on exit (leak)
- Leaving `FILE *` open after failed saves/loads
- Allowing `|` in titles (corrupts the line format)
- Use-after-free if holding a `Task *` across a `realloc` that grows the store — prefer ids for long-lived references
- Double-free by freeing store items individually (the store owns one block)

## Practice exercises / enhancements

1. **Filter by status:** Print only tasks matching a chosen status (see `solution.c`).
2. **Priority counts:** Summarize how many tasks are low/medium/high (`solution.c` also demos this).
3. **Edit title:** Add a menu action that changes a task’s title with the same safety checks as add.
4. **Sort by id:** Add `store_sort_by_id` using `task_compare_id_asc`.

## What you should understand before continuing

- [ ] I can compile the multi-file project with one `gcc` line
- [ ] I understand which module owns the heap array
- [ ] Save/load round-trips a task without corruption
- [ ] Invalid menu input does not crash the program
- [ ] Quitting frees all allocations and closes files

## Note on `solution.c`

Work the enhancements in the main project if you can. `solution.c` is a complete alternate entry point that links `task.c`, `store.c`, and `util.c` to demonstrate **filter by status** and **priority counts** without modifying `main.c`.
