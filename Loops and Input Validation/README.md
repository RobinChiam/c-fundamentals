# Lesson 4: Loops and Input Validation

**Difficulty:** Beginner  
**Prerequisites:** [Conditional Statements](../Conditional%20Statements/)

## Learning objectives

- Use `while`, `do while`, and `for` loops appropriately
- Apply `break` and `continue`
- Read numbers until a sentinel value
- Validate numeric input safely with `fgets` + `strtol`
- Recover cleanly from invalid input (no leftover newline traps)
- Avoid infinite loops and off-by-one errors

## Concepts (plain language)

A **loop** repeats work. Choose the form that matches the situation:

| Loop | When it fits |
|------|----------------|
| `while` | Repeat while a condition is true; may run zero times |
| `do while` | Body should run at least once (menus, “try until valid”) |
| `for` | Counted iteration with clear init / test / update |

A **sentinel** is a special value (for example `-999`) that means “stop,” not “add this to the list.”

**Input validation** means checking that text from the user is actually an integer (and optionally in range) before using it. Prefer `fgets` to read a line, then parse with `strtol`/`sscanf`. Never use `gets`. Avoid uncontrolled `%s` with `scanf`.

**Off-by-one** errors usually come from using `<` when you meant `<=` (or the reverse). Trace the first and last iteration on paper.

## Important syntax

```c
while (condition) { /* ... */ }
do { /* ... */ } while (condition);
for (i = 0; i < n; i++) { /* ... */ }
break;     /* leave the loop */
continue;  /* skip to next iteration */
```

Safe integer read pattern (see `read_int` in `loops.c`): prompt → `fgets` → `strtol` → check `end` pointer / range → retry on failure.

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic loops.c -o loops.exe
loops.exe
```

## Example interaction / output

```text
=== Enter integers (sentinel -999 to stop) ===
Number: 10
Number: 20
Number: abc
Not an integer; try again.
Number: 30
Number: -999
Count=3  Sum=60  Average=20.00

=== do-while confirmation ===
Enter 1 to continue: 1

=== Multiplication table for 7 (for-loop) ===
7 x  1 =  7
...
Press Enter to exit...
```

## Common mistakes

- Infinite loops: forgetting to update the loop variable or to `break` on the sentinel
- Off-by-one in `for` bounds
- Using `scanf("%d")` and then struggling with leftover newlines after bad input
- Counting the sentinel as a real data value
- `continue` / `break` in the wrong place, skipping needed work

## Practice exercises

1. Compute `n!` after validating that `n` is in a safe range (for example 0–20).
2. Write a guess-the-number loop that hints “too low” / “too high” until correct.
3. Print only even numbers in a range using `continue` to skip odds.

Try the exercises yourself before opening `solution.c`. That file is the **reference solution** for the exercises above.

## What you should understand before continuing

- [ ] Differences among `while`, `do while`, and `for`
- [ ] How sentinel-controlled input works
- [ ] Why `fgets` + parsing recovers better than bare `scanf` for invalid lines
- [ ] What `break` and `continue` do
- [ ] How to spot and fix off-by-one mistakes

Next: [Functions and Scope](../Functions%20and%20Scope/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
