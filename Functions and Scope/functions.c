/*
 * Lesson 5 — Functions and Scope (primary demo)
 *
 * Declarations vs definitions, parameters/returns, local vs file-scope,
 * pass-by-value, decomposition into helpers, recursive vs iterative factorial.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic functions.c -o functions.exe
 */

#include <stdio.h>

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Separate from core lesson logic. Portable Enter wait via getchar.
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

/* File-scope constant: visible to all functions in this translation unit.
 * Prefer locals for changing data; file-scope is justified here because the
 * value is shared read-only configuration, not mutable program state. */
static const int DEMO_BASE = 2;

/* Optional static counter: file-scope + static limits linkage to this file.
 * Each call to bump_demo_counter updates the same persistent object.
 * Prefer locals unless you truly need persistence across calls. */
static int demo_call_count = 0;

static void bump_demo_counter(void)
{
    demo_call_count += 1;
}

/* Declarations (prototypes) tell the compiler the name, return type, and
 * parameter types before the definitions appear below. */
static int max_of_two(int a, int b);
static long long power_iterative(int base, int exponent);
static long long factorial_iterative(int n);
static long long factorial_recursive(int n);
static void try_modify_copy(int value);

int main(void)
{
    int first = 12;
    int second = 27;
    int original = 100;
    long long powered = 0LL;
    long long fact_iter = 0LL;
    long long fact_rec = 0LL;

    bump_demo_counter();

    printf("=== Decomposition: small helpers ===\n");
    printf("max_of_two(%d, %d) = %d\n", first, second, max_of_two(first, second));

    powered = power_iterative(DEMO_BASE, 8);
    printf("power_iterative(%d, 8) = %lld\n", DEMO_BASE, powered);

    printf("\n=== Factorial: iterative vs recursive ===\n");
    fact_iter = factorial_iterative(6);
    fact_rec = factorial_recursive(6);
    printf("6! iterative  = %lld\n", fact_iter);
    printf("6! recursive  = %lld\n", fact_rec);
    printf("(Same result; recursion expresses the math directly, iteration\n");
    printf(" usually uses less stack for large n.)\n");

    printf("\n=== Pass-by-value ===\n");
    printf("original before call: %d\n", original);
    try_modify_copy(original);
    printf("original after call : %d  (unchanged — function got a copy)\n", original);

    printf("\n=== File-scope demo counter calls so far: %d ===\n", demo_call_count);

    pause_at_exit();
    return 0;
}

/* Definitions: the actual function bodies. */

static int max_of_two(int a, int b)
{
    bump_demo_counter();
    if (a >= b) {
        return a;
    }
    return b;
}

static long long power_iterative(int base, int exponent)
{
    long long result = 1LL;
    int i = 0;

    bump_demo_counter();
    if (exponent < 0) {
        return 0LL; /* keep this demo in integers only */
    }
    for (i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}

static long long factorial_iterative(int n)
{
    long long result = 1LL;
    int i = 0;

    bump_demo_counter();
    if (n < 0) {
        return 0LL;
    }
    for (i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/* Recursive definition: n! = n * (n-1)! with base case 0! = 1.
 * Each call waits for a smaller call to finish (uses the call stack). */
static long long factorial_recursive(int n)
{
    bump_demo_counter();
    if (n < 0) {
        return 0LL;
    }
    if (n == 0 || n == 1) {
        return 1LL; /* base case stops the recursion */
    }
    return (long long)n * factorial_recursive(n - 1);
}

/* Demonstrates pass-by-value: assigning to the parameter does not change
 * the caller's variable. */
static void try_modify_copy(int value)
{
    bump_demo_counter();
    printf("  inside try_modify_copy, value starts as %d\n", value);
    value = 999;
    printf("  inside try_modify_copy, value set to %d\n", value);
}
