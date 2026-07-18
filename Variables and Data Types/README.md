# Lesson 1: Variables and Data Types

**Difficulty:** Beginner  
**Prerequisites:** Ability to open a terminal, edit a `.c` file, and run `gcc`

## Learning objectives

- Understand the basic structure of a C program and `int main(void)`
- Declare and initialize `char`, `int`, `float`, and `double` variables
- Use constants with `#define` and `const`
- Match types to `printf` format specifiers
- Perform basic type conversions and inspect sizes with `sizeof`

## Concepts (plain language)

A **variable** is a named box in memory that holds a value of a specific **type**. The type tells the compiler how many bytes to reserve and how to interpret those bits (integer, floating point, character, etc.).

**Initialization** means giving a variable a known value when you create it. Leaving locals uninitialized is a common source of mysterious bugs.

**Constants** are values that should not change. `#define` is a textual substitution done before compilation; `const` is a typed value the compiler can check.

**Format specifiers** (`%d`, `%c`, `%f`, …) tell `printf` how to print a value. Mismatched types and formats are undefined behavior and a frequent beginner mistake.

**`sizeof`** asks the compiler how many bytes a type (or object) occupies on *this* platform. Sizes can differ between machines; do not hard-code assumptions like “`int` is always 4.”

## Important syntax

```c
int count = 0;              /* declaration + initialization */
const double tax_rate = 0.08;
#define PI_APPROX 3.14159

printf("%d %c %.2f\n", count, 'A', 3.14);
size_t bytes = sizeof(int); /* %zu to print size_t */
int truncated = (int)3.9;   /* cast: fractional part discarded */
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic variables.c -o variables.exe
variables.exe
```

## Example interaction / output

(Exact `sizeof` values may differ by platform.)

```text
=== Common types and format specifiers ===
char   letter            = 'A'  (%c)
int    whole_number      = 42    (%d)
float  single_precision  = 3.14  (%.2f)
double double_precision  = 2.718282  (%.6f)
...
=== sizeof (bytes on this machine/ABI) ===
sizeof(char)   = 1
sizeof(int)    = 4
...
Press Enter to exit...
```

## Common mistakes

- Using a variable before initializing it
- Printing an `int` with `%f` or a `double` with `%d`
- Writing `9 / 5` when you meant floating-point division (`9.0 / 5.0`)
- Assuming every type’s size is the same on every computer
- Using `gets` or uncontrolled `%s` with `scanf` (not used in this curriculum)

## Practice exercises

1. Declare Celsius and Fahrenheit temperatures; convert each way and print results.
2. Print `sizeof` for `char`, `int`, `float`, and `double`.
3. Use a `const` tax rate to compute tax and total for an item price.

Try the exercises yourself before opening `solution.c`. That file is the **reference solution** for the exercises above.

## What you should understand before continuing

- [ ] Why `int main(void)` is the program entry point and returns an `int` status
- [ ] How to declare and initialize the four basic types covered here
- [ ] When to use `#define` vs `const`
- [ ] Which format specifier matches each type you print
- [ ] What `(int)` on a floating value does (truncation, not rounding)
- [ ] That `sizeof` reports platform-dependent sizes

Next: [Operators and Expressions](../Operators%20and%20Expressions/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
