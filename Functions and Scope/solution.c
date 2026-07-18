/*
 * Lesson 5 — Functions and Scope (reference solution)
 *
 * Exercises:
 *   1) is_prime
 *   2) celsius_to_fahrenheit function
 *   3) recursive sum 1..n plus an iterative version
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Separate from core lesson logic.
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

static int is_prime(int n);
static double celsius_to_fahrenheit(double celsius);
static long long sum_to_n_recursive(int n);
static long long sum_to_n_iterative(int n);

int main(void)
{
    int candidates[] = {2, 3, 4, 17, 20, 97};
    int i = 0;
    double celsius = 25.0;
    int n = 10;

    printf("=== is_prime ===\n");
    for (i = 0; i < (int)(sizeof candidates / sizeof candidates[0]); i++) {
        printf("%d -> %s\n",
               candidates[i],
               is_prime(candidates[i]) ? "prime" : "not prime");
    }

    printf("\n=== celsius_to_fahrenheit ===\n");
    printf("%.1f C = %.1f F\n", celsius, celsius_to_fahrenheit(celsius));
    printf("%.1f C = %.1f F\n", 0.0, celsius_to_fahrenheit(0.0));
    printf("%.1f C = %.1f F\n", 100.0, celsius_to_fahrenheit(100.0));

    printf("\n=== Sum 1..%d ===\n", n);
    printf("recursive: %lld\n", sum_to_n_recursive(n));
    printf("iterative: %lld\n", sum_to_n_iterative(n));

    pause_at_exit();
    return 0;
}

/* Return 1 if n is prime, 0 otherwise. */
static int is_prime(int n)
{
    int divisor = 0;

    if (n <= 1) {
        return 0;
    }
    if (n == 2) {
        return 1;
    }
    if (n % 2 == 0) {
        return 0;
    }
    /* Only test odd divisors up to sqrt(n) without needing <math.h>:
     * divisor * divisor may overflow for huge n; fine for typical demo ints. */
    for (divisor = 3; divisor * divisor <= n; divisor += 2) {
        if (n % divisor == 0) {
            return 0;
        }
    }
    return 1;
}

static double celsius_to_fahrenheit(double celsius)
{
    return celsius * 9.0 / 5.0 + 32.0;
}

/* Sum(n) = n + Sum(n-1), with Sum(1) = 1 (and Sum(0) = 0). */
static long long sum_to_n_recursive(int n)
{
    if (n <= 0) {
        return 0LL;
    }
    if (n == 1) {
        return 1LL;
    }
    return (long long)n + sum_to_n_recursive(n - 1);
}

static long long sum_to_n_iterative(int n)
{
    long long total = 0LL;
    int i = 0;

    if (n <= 0) {
        return 0LL;
    }
    for (i = 1; i <= n; i++) {
        total += i;
    }
    return total;
}
