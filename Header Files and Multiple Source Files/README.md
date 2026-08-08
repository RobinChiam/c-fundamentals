# Lesson 12: Header Files and Multiple Source Files

**Difficulty:** Intermediate  
**Prerequisites:** [Functions and Scope](../Functions%20and%20Scope/) and [Structures and Enumerations](../Structures%20and%20Enumerations/)

## Learning objectives

- Split a program into multiple `.c` translation units
- Publish an API with a `.h` header (prototypes and types only)
- Use include guards to prevent double inclusion
- Keep responsibilities clear: UI in `main.c`, math in `geometry.c`
- Compile **all** required sources in one `gcc` command

## Concepts

A **translation unit** is one `.c` file plus everything it `#include`s, compiled to an object. The linker then combines objects into an executable.

| Piece | Responsibility |
|-------|----------------|
| `geometry.h` | Types + function prototypes (the public contract) |
| `geometry.c` | Function definitions implementing that contract |
| `main.c` | `main`, input/output, calls into geometry |

**Include guards** (`#ifndef` / `#define` / `#endif`) ensure a header’s contents are processed at most once per translation unit.

**Do not put ordinary function definitions in headers** unless you understand `static inline` and ODR-style pitfalls. This lesson keeps definitions in `.c` files.

## Syntax highlights

```c
/* geometry.h */
#ifndef GEOMETRY_H
#define GEOMETRY_H
double rect_area(const Rect *r);
#endif

/* geometry.c */
#include "geometry.h"
double rect_area(const Rect *r) { /* ... */ }

/* main.c */
#include "geometry.h"
```

Use quotes (`"geometry.h"`) for project headers; angle brackets (`<stdio.h>`) for system headers.

## Build and run

Compile **every** `.c` that belongs to the program:

```text
gcc -std=c17 -Wall -Wextra -Wpedantic main.c geometry.c -o geometry_demo.exe -lm
geometry_demo.exe
```

Exercise solutions (link the same library):

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c geometry.c -o solution.exe -lm
solution.exe
```

`-lm` links the math library (`sqrt` in `geometry.c`). On some MinGW setups it may be optional; on Linux it is typically required.

## Example I/O

```text
=== Lesson 12: Header Files and Multiple Source Files ===
main.c talks to the user; geometry.c does the math.

--- Rectangle ---
width (> 0): 4
height (> 0): 2.5
Rect 4.000 x 2.500 -> area=10.000 perimeter=13.000

--- Circle ---
radius (> 0): 1
Circle r=1.000 -> area=3.142 circumference=6.283

--- Distance ---
Distance from (0,0) to (3,4) = 5.000 (expect 5.000)
```

## Common mistakes

- Defining functions in the header and including it from multiple `.c` files (multiple definition linker errors)
- Forgetting to list `geometry.c` on the compile line (`undefined reference`)
- Missing include guards
- Putting `main` in more than one linked `.c` file
- Circular includes without careful design
- Editing only the `.h` prototype and forgetting to update the `.c` definition (or vice versa)

## Practice exercises

1. **Interactive distance:** Read four doubles `(x1,y1,x2,y2)` and print `point_distance(...)`.
2. **Area comparison:** Read a rectangle and a circle; print which has the larger area (or equal).
3. **Guards:** Briefly explain (in your own words) what would go wrong if `geometry.h` had no include guards and were included twice.

## What you should understand before continuing

- [ ] I can draw a diagram of which file calls which
- [ ] My header has guards and prototypes only
- [ ] Implementations live in `.c` files
- [ ] My build command lists every needed `.c`
- [ ] The program links cleanly with `-Wall -Wextra -Wpedantic`

Next: [Searching and Sorting](../Searching%20and%20Sorting/)

## Note on `solution.c`

Try the exercises in a copy of `main.c` first. `solution.c` implements exercises 1–2 by linking with `geometry.c` and documents exercise 3 in comments/output. Compile with the `solution.c geometry.c` line above.
