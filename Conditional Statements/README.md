# Lesson 3: Conditional Statements

**Difficulty:** Beginner  
**Prerequisites:** [Operators and Expressions](../Operators%20and%20Expressions/)

## Learning objectives

- Branch with `if`, `else if`, and `else`
- Nest conditions thoughtfully
- Use `switch` for multi-way choices on integer/menu values
- Combine conditions with `&&` and `||`
- Build a small menu-driven console flow

## Concepts (plain language)

A **conditional** lets the program choose a path based on whether an expression is true (non-zero) or false (`0`).

`if` / `else if` / `else` is ideal when ranges or complex boolean tests decide the branch (for example, letter grades from a numeric score).

`switch` is ideal when one integer (or character) value selects among discrete options—menus are a classic fit. Each `case` usually ends with `break` so execution does not fall into the next case.

**Nested** conditions put one decision inside another. Keep nesting shallow; deep nesting is hard to read. Prefer early returns or clearer boolean expressions when possible.

## Important syntax

```c
if (score >= 90) {
    grade = 'A';
} else if (score >= 80) {
    grade = 'B';
} else {
    grade = 'F';
}

switch (choice) {
case 1:
    /* ... */
    break;
default:
    /* ... */
    break;
}
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic conditions.c -o conditions.exe
conditions.exe
```

## Example interaction / output

```text
=== Grade classifier ===
Enter score (0-100): 87
Letter grade: B
Passing — keep practicing.

=== Simple calculator menu (switch) ===
1) Add
2) Subtract
3) Multiply
4) Divide
Choose 1-4: 4
Left operand: 20
Right operand: 8
20 / 8 = 2.50
Press Enter to exit...
```

## Common mistakes

- Using `=` instead of `==` inside conditions
- Forgetting `break` in `switch` (unwanted fall-through)
- Overlapping `else if` ranges in the wrong order (put stricter ranges first)
- Dividing by zero without a guard
- Deep nesting that could be flattened with clearer logic

## Practice exercises

1. Ask for a year and report whether it is a leap year.
2. Implement rock-paper-scissors (or a number-guess style decision) with `if`.
3. Expand the calculator menu with more operations (for example modulo and integer power).

Try the exercises yourself before opening `solution.c`. That file is the **reference solution** for the exercises above.

## What you should understand before continuing

- [ ] How `if` / `else if` / `else` chooses exactly one path
- [ ] How `switch` differs from cascading `if`s
- [ ] Why `break` matters in `switch`
- [ ] How to combine conditions with `&&` and `||`
- [ ] How a simple menu reads a choice and dispatches work

Next: [Loops and Input Validation](../Loops%20and%20Input%20Validation/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
