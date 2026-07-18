# Lesson 11: Dynamic Memory Allocation

**Difficulty:** Intermediate  
**Prerequisites:** [File Input and Output](../File%20Input%20and%20Output/) (and earlier lessons on arrays, pointers, and functions)

## Learning objectives

- Allocate and release heap memory with `malloc`, `calloc`, `realloc`, and `free`
- Always check allocation results for `NULL`
- Understand ownership and lifetime of heap blocks
- Grow a dynamic array with `realloc` without leaking on failure
- Avoid leaks, double-free, and use-after-free
- Clean up correctly when a multi-step allocation partially fails

## Concepts

| Function | Role |
|----------|------|
| `malloc(n)` | Request `n` uninitialized bytes; returns `void *` or `NULL` |
| `calloc(count, size)` | Request `count * size` bytes **zeroed**; returns `NULL` on failure |
| `realloc(ptr, n)` | Resize a previous block (may move it); returns new pointer or `NULL` |
| `free(ptr)` | Release a block; `free(NULL)` is a safe no-op |

**Ownership:** Whoever receives a successful allocation pointer is responsible for eventually calling `free` exactly once on that block (or transferring ownership clearly).

**Lifetime:** A heap block lives until `free`. After `free`, the pointer is dangling — do not read or write through it. A common habit is `ptr = NULL` immediately after `free`.

**`realloc` caution:** Always store the result in a temporary. If `realloc` fails, the original block is still valid; overwriting the only pointer with `NULL` would leak it.

## Syntax highlights

```c
int *p = malloc(10 * sizeof *p);
if (p == NULL) { /* handle failure */ }

int *z = calloc(10, sizeof *z);  /* all zeros */

int *grown = realloc(p, 20 * sizeof *p);
if (grown == NULL) {
    /* p is still valid — do not lose it */
} else {
    p = grown;
}

free(p);
p = NULL;
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic dynamic_memory.c -o dynamic_memory.exe
dynamic_memory.exe
```

Exercise solutions:

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```

## Example I/O

```text
=== Lesson 11: Dynamic Memory Allocation ===

Build a growable list of integers.
Enter non-negative integers one per line.
Enter -1 (or a blank line) when finished.

value (or -1 to stop): 3
  current (count=1, capacity=4): 3
value (or -1 to stop): 7
  current (count=2, capacity=4): 3 7
value (or -1 to stop): 1
  current (count=3, capacity=4): 3 7 1
value (or -1 to stop): -1

--- Final growable list ---
values (count=3, capacity=4): 3 7 1
Sum of 3 value(s): 11

--- calloc demo (5 zeroed ints) ---
calloc block: 0 0 0 0 0
after zeros[2] = 42: 0 0 42 0 0
...
```

## Common mistakes

- Using `gets` (never) or unbounded `scanf("%s", ...)` for strings
- Forgetting to check `malloc` / `calloc` / `realloc` for `NULL`
- Calling `free` twice on the same pointer (double-free)
- Using memory after `free` (use-after-free)
- On `realloc` failure, assigning `NULL` over the only remaining pointer (leak)
- Forgetting `free` on every success path (leak), especially after early `return`
- Mixing up `sizeof(pointer)` vs `sizeof(*pointer)` when sizing allocations

## Practice exercises

1. **Dynamic average:** Ask for `N`, `malloc` an array of `N` doubles, read the values, print the average, then `free` the array.
2. **Shrink with `realloc`:** After filling fewer slots than capacity, call `realloc` to trim capacity to `count` and print before/after.
3. **Safe duplicate:** Write a function that allocates a copy of an `int` array; mutate the copy; prove the original is unchanged; free only the copy.

## What you should understand before continuing

- [ ] I can explain when to use `malloc` vs `calloc`
- [ ] I check every allocation result
- [ ] I understand why `realloc` needs a temporary pointer
- [ ] I free every successful allocation exactly once
- [ ] I set pointers to `NULL` after `free` as a defensive habit
- [ ] On partial failure I free earlier successes before returning

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` walks through all three exercises with the same safe input and cleanup habits as the primary example.
