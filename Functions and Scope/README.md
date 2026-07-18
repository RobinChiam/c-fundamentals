# Lesson 5: Functions and Scope

**Difficulty:** Beginner–Intermediate  
**Prerequisites:** [Loops and Input Validation](../Loops%20and%20Input%20Validation/)

## Learning objectives

- Declare and define functions with parameters and return values
- Distinguish local variables from file-scope names
- Understand pass-by-value (caller ints are not modified by assigning to parameters)
- Decompose a problem into small helpers
- Compare a simple recursive solution with an iterative one

## Concepts (plain language)

A **function** packages a named piece of work. You **declare** it (tell the compiler the signature) and **define** it (provide the body). Callers pass **arguments**; the function receives them as **parameters**.

**Scope** answers “where is this name visible?”

- **Local**: declared inside a function; exists only during that call
- **File-scope**: declared outside functions; visible from that point onward in the `.c` file. `static` at file scope also prevents other `.c` files from linking to it

C passes ordinary `int`/`double` arguments **by value**: the function gets a copy. Changing the parameter does not change the caller’s variable. (Later lessons introduce pointers for out-parameters.)

**Recursion** is a function calling itself with a smaller subproblem until a **base case** stops the chain. Iteration with a loop often uses less stack; recursion can mirror a mathematical definition more directly.

## Important syntax

```c
static int max_of_two(int a, int b);   /* declaration / prototype */

static int max_of_two(int a, int b)    /* definition */
{
    if (a >= b) {
        return a;
    }
    return b;
}

/* pass-by-value: caller's x stays the same */
void f(int x) { x = 0; }
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic functions.c -o functions.exe
functions.exe
```

## Example interaction / output

```text
=== Decomposition: small helpers ===
max_of_two(12, 27) = 27
power_iterative(2, 8) = 256

=== Factorial: iterative vs recursive ===
6! iterative  = 720
6! recursive  = 720
...
=== Pass-by-value ===
original before call: 100
  inside try_modify_copy, value starts as 100
  inside try_modify_copy, value set to 999
original after call : 100  (unchanged — function got a copy)
...
Press Enter to exit...
```

## Common mistakes

- Using a function before any declaration/definition the compiler has seen
- Forgetting `return` on a non-`void` function on some paths
- Expecting `void f(int x) { x = 1; }` to change the caller’s variable
- Missing a recursive base case (infinite recursion / stack overflow)
- Overusing file-scope mutable variables instead of parameters and locals

## Practice exercises

1. Write `is_prime(int n)` that returns 1 if prime, otherwise 0.
2. Write `celsius_to_fahrenheit(double c)` and print a few conversions.
3. Write a recursive `sum` of `1..n` and match it with an iterative version.

Try the exercises yourself before opening `solution.c`. That file is the **reference solution** for the exercises above.

## What you should understand before continuing

- [ ] How prototypes and definitions relate
- [ ] How parameters and return values move data in and out
- [ ] Local vs file-scope visibility (and why locals are preferred)
- [ ] What pass-by-value means for `int` arguments
- [ ] When recursion needs a base case
- [ ] How to split a program into small testable helpers

Next: [Arrays](../Arrays/)

## Note on `solution.c`

Attempt the exercises yourself first. `solution.c` is a reference solution for this lesson's practice exercises.
