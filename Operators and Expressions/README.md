# Lesson 2: Operators and Expressions

**Difficulty:** Beginner  
**Prerequisites:** [Variables and Data Types](../Variables%20and%20Data%20Types/)

## Learning objectives

- Use arithmetic, assignment, increment/decrement, comparison, and logical operators
- Understand operator precedence and when to add parentheses
- Distinguish integer division from floating-point division
- Use `/` and `%` together for “make change” style problems

## Concepts (plain language)

An **expression** combines values and operators to produce a new value. Operators are the symbols (`+`, `*`, `==`, `&&`, …) that say *how* to combine them.

**Integer division** (`17 / 5`) drops the fractional part and yields `3`. The **remainder** operator (`%`) gives what is left (`17 % 5` is `2`). For money and counts, integers plus `/` and `%` are often clearer than floating point.

**Precedence** decides which operator runs first when you omit parentheses—like order of operations in math. When unsure, use parentheses; clarity beats cleverness.

**Logical operators** (`&&`, `||`, `!`) work with true/false values. In C, “false” is `0` and “true” is any non-zero value; comparison operators produce `1` or `0`. `&&` and `||` **short-circuit**: if the left side already decides the result, the right side is not evaluated.

## Important syntax

```c
int q = 17 / 5;     /* 3 */
int r = 17 % 5;     /* 2 */
x += 3;             /* x = x + 3 */
++i;  i++;          /* prefix vs postfix */
(a > b) && (c < d);
2 + 3 * 4;          /* 14, not 20 */
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic operators.c -o operators.exe
operators.exe
```

## Example interaction / output

```text
=== Arithmetic (left=17, right=5) ===
sum        17 + 5 = 22
...
quotient   17 / 5 = 3  (integer division)
remainder  17 % 5 = 2
...
=== Precedence (why parentheses matter) ===
2 + 3 * 4     = 14  (not 20)
(2 + 3) * 4   = 20
...
Press Enter to exit...
```

## Common mistakes

- Expecting `5 / 2` to be `2.5` (it is `2` with `int` operands)
- Writing `=` (assign) when you meant `==` (compare)
- Forgetting that `*` and `/` bind tighter than `+` and `-`
- Confusing postfix `i++` with prefix `++i` inside larger expressions
- Using floating point for exact money without care

## Practice exercises

1. Given an amount in cents, compute dollars, quarters, dimes, nickels, and pennies with `/` and `%`.
2. Evaluate several expressions and print results that highlight precedence (with and without parentheses).
3. Compute BMI (or a similar formula) using `double` multiplication and division.

Try the exercises yourself before opening `solution.c`. That file is the **reference solution** for the exercises above.

## What you should understand before continuing

- [ ] What each arithmetic operator does, including `%`
- [ ] Why integer division truncates
- [ ] Difference between `=` and `==`
- [ ] How `&&`, `||`, and `!` combine conditions
- [ ] When to add parentheses for clarity and correctness
- [ ] How a compound float expression (like BMI) is written

Next: [Conditional Statements](../Conditional%20Statements/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
