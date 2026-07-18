/*
 * Lesson 2 — Operators and Expressions (reference solution)
 *
 * Exercises:
 *   1) Make change with / and %
 *   2) Evaluate expressions that show precedence
 *   3) BMI (or similar) with floating-point operators
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

int main(void)
{
    /* --- Exercise 1: making change with / and % --- */
    int amount_cents = 287; /* $2.87 as integer cents avoids float money bugs */
    int dollars = 0;
    int quarters = 0;
    int dimes = 0;
    int nickels = 0;
    int pennies = 0;
    int remaining = 0;

    dollars = amount_cents / 100;
    remaining = amount_cents % 100;
    quarters = remaining / 25;
    remaining = remaining % 25;
    dimes = remaining / 10;
    remaining = remaining % 10;
    nickels = remaining / 5;
    pennies = remaining % 5;

    printf("=== Making change for %d cents ===\n", amount_cents);
    printf("dollars  : %d\n", dollars);
    printf("quarters : %d\n", quarters);
    printf("dimes    : %d\n", dimes);
    printf("nickels  : %d\n", nickels);
    printf("pennies  : %d\n", pennies);

    /* --- Exercise 2: precedence demonstrations --- */
    printf("\n=== Precedence evaluations ===\n");
    printf("3 + 4 * 5 - 6     = %d\n", 3 + 4 * 5 - 6);       /* 3+20-6 = 17 */
    printf("(3 + 4) * (5 - 6) = %d\n", (3 + 4) * (5 - 6));   /* 7 * -1 = -7 */
    printf("8 / 4 * 2 + 1     = %d\n", 8 / 4 * 2 + 1);       /* left-to-right: 4+1=5 */
    printf("8 / (4 * 2) + 1   = %d\n", 8 / (4 * 2) + 1);     /* 8/8 + 1 = 2 */
    printf("5 > 3 && 2 < 1    = %d\n", 5 > 3 && 2 < 1);      /* 1 && 0 = 0 */
    printf("5 > 3 || 2 < 1    = %d\n", 5 > 3 || 2 < 1);      /* 1 || 0 = 1 */

    /* --- Exercise 3: BMI with float ops --- */
    double height_m = 1.80;
    double weight_kg = 82.5;
    double bmi = 0.0;

    bmi = weight_kg / (height_m * height_m);

    printf("\n=== BMI ===\n");
    printf("height = %.2f m\n", height_m);
    printf("weight = %.1f kg\n", weight_kg);
    printf("BMI    = %.1f\n", bmi);

    pause_at_exit();
    return 0;
}
