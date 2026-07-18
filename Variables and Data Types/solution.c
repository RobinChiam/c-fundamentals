/*
 * Lesson 1 — Variables and Data Types (reference solution)
 *
 * Exercises solved:
 *   1) Celsius/Fahrenheit temperatures with conversion
 *   2) Print sizeof for common types
 *   3) Use const for a tax-rate calculation
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Separate from core lesson logic. Portable Enter wait (prefer over
 * system("pause") as the only path).
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

int main(void)
{
    /* --- Exercise 1: temperature conversion --- */
    double celsius = 25.0;
    double fahrenheit = 77.0;
    double celsius_from_f = 0.0;
    double fahrenheit_from_c = 0.0;

    /* Formulas: F = C * 9/5 + 32  and  C = (F - 32) * 5/9
     * Use 9.0/5.0 so the division is floating-point, not integer 9/5 == 1. */
    fahrenheit_from_c = celsius * 9.0 / 5.0 + 32.0;
    celsius_from_f = (fahrenheit - 32.0) * 5.0 / 9.0;

    printf("=== Temperature conversion ===\n");
    printf("%.1f C  ->  %.1f F\n", celsius, fahrenheit_from_c);
    printf("%.1f F  ->  %.1f C\n", fahrenheit, celsius_from_f);

    /* --- Exercise 2: sizeof for common types --- */
    printf("\n=== sizeof results ===\n");
    printf("sizeof(char)   = %zu bytes\n", sizeof(char));
    printf("sizeof(int)    = %zu bytes\n", sizeof(int));
    printf("sizeof(float)  = %zu bytes\n", sizeof(float));
    printf("sizeof(double) = %zu bytes\n", sizeof(double));

    /* --- Exercise 3: tax rate as const --- */
    const double tax_rate = 0.08; /* 8% sales tax; cannot be reassigned */
    double item_price = 49.99;
    double tax_amount = 0.0;
    double total_due = 0.0;

    tax_amount = item_price * tax_rate;
    total_due = item_price + tax_amount;

    printf("\n=== Tax calculation (const tax_rate) ===\n");
    printf("Item price : $%.2f\n", item_price);
    printf("Tax rate   : %.0f%%\n", tax_rate * 100.0);
    printf("Tax amount : $%.2f\n", tax_amount);
    printf("Total due  : $%.2f\n", total_due);

    pause_at_exit();
    return 0;
}
