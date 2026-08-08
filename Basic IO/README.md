# Lesson 0: Basic IO

**Difficulty:** Beginner (starter)  
**Prerequisites:** A text editor and GCC installed (see the [root README](../README.md))

## Learning objectives

- Compile and run a minimal C program
- Use `printf` for text output
- Read a line of text safely with `fgets` instead of unbounded `scanf`
- Wait for Enter before exit on Windows without `system("pause")`

## Concepts

This is the **first hands-on program** in the curriculum. Later lessons (1–14) build on the same habits: strict compiler warnings, validated input, and portable pause-at-exit helpers.

`fgets` reads up to one line into a **fixed-size buffer**, which prevents the buffer overflow risk of `scanf("%s", ...)` into a tiny array.

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic main.c -o main.exe
main.exe
```

Reference solution (age exercise):

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```

## Practice exercises

1. After greeting the user, ask for their age and print a friendly message (see `solution.c`).
2. Reject empty names and show a clear error message.
3. Add a second `printf` that prints the length of the name with `strlen`.

Try the exercises yourself before opening `solution.c`.

## What you should understand before continuing

- [ ] How to compile with `-Wall -Wextra -Wpedantic`
- [ ] Why `fgets` into a sized buffer is safer than `scanf("%s")` for words
- [ ] How to strip the trailing newline from `fgets` input
- [ ] That `system("pause")` is Windows-specific and not used in newer lessons

Next: [Drawing Shapes](../Drawing%20Shapes/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
