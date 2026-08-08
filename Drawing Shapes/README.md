# Lesson 0: Drawing Shapes

**Difficulty:** Beginner (starter)  
**Prerequisites:** [Basic IO](../Basic%20IO/) or equivalent compile/run experience

## Learning objectives

- Use nested `for` loops to repeat work in two dimensions
- Validate numeric input before using it as a loop bound
- See how loop variables control row and column output

## Concepts

The starter program prints a **left-aligned pyramid** of `#` characters. Each row prints one more hash than the row before it.

Nested loops are a common pattern: an outer loop walks rows, and an inner loop prints characters on that row.

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic shapes.c -o shapes.exe
shapes.exe
```

Centered pyramid (reference solution):

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```

## Practice exercises

1. Change the character from `#` to another symbol (for example `*`).
2. Draw a **centered** pyramid with leading spaces (see `solution.c`).
3. Add a maximum height check and reject negative input with a clear message.

Try the exercises yourself before opening `solution.c`.

## What you should understand before continuing

- [ ] How nested loops relate to rows and columns
- [ ] Why loop bounds must be validated before use
- [ ] How to compile with strict warning flags

Next: [Variables and Data Types](../Variables%20and%20Data%20Types/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
