/*
 * Lesson 2 — Operators and Expressions (primary demo)
 *
 * Demonstrates arithmetic, assignment, ++/--, comparison, logical operators,
 * precedence, and the difference between integer division and remainder.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic operators.c -o operators.exe
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

int main(void)
{
    int left = 17;
    int right = 5;
    int result = 0;
    int counter = 10;
    double height_m = 1.75;
    double weight_kg = 70.0;
    double bmi = 0.0;

    printf("=== Arithmetic (left=%d, right=%d) ===\n", left, right);
    printf("sum        %d + %d = %d\n", left, right, left + right);
    printf("difference %d - %d = %d\n", left, right, left - right);
    printf("product    %d * %d = %d\n", left, right, left * right);
    /* Integer division truncates toward zero; remainder is the leftover. */
    printf("quotient   %d / %d = %d  (integer division)\n", left, right, left / right);
    printf("remainder  %d %% %d = %d\n", left, right, left % right);
    printf("as float   %d / %d = %.2f\n", left, right, (double)left / (double)right);

    printf("\n=== Assignment and compound assignment ===\n");
    result = left;          /* simple assignment */
    result += right;        /* same as result = result + right */
    printf("after result = left; result += right  ->  %d\n", result);
    result *= 2;
    printf("after result *= 2                     ->  %d\n", result);

    printf("\n=== Increment / decrement ===\n");
    counter = 10;
    printf("counter starts at %d\n", counter);
    /* postfix: use current value, then change; prefix: change, then use.
     * Do not read and modify the same scalar in one expression (undefined). */
    result = counter++;
    printf("counter++ yields %d, then counter is %d\n", result, counter);
    result = ++counter;
    printf("++counter yields %d (already updated)\n", result);
    result = --counter;
    printf("--counter yields %d\n", result);

    printf("\n=== Comparison (result is 1 for true, 0 for false) ===\n");
    printf("%d == %d  -> %d\n", left, right, left == right);
    printf("%d != %d  -> %d\n", left, right, left != right);
    printf("%d >  %d  -> %d\n", left, right, left > right);
    printf("%d <= %d  -> %d\n", left, right, left <= right);

    printf("\n=== Logical operators ===\n");
    /* && and || short-circuit: the right side may not be evaluated. */
    printf("(left > 10) && (right < 10) -> %d\n", (left > 10) && (right < 10));
    printf("(left < 10) || (right < 10) -> %d\n", (left < 10) || (right < 10));
    printf("!(left == right)            -> %d\n", !(left == right));

    printf("\n=== Precedence (why parentheses matter) ===\n");
    /* * and / bind tighter than + and -; comparisons bind tighter than &&. */
    printf("2 + 3 * 4     = %d  (not 20)\n", 2 + 3 * 4);
    printf("(2 + 3) * 4   = %d\n", (2 + 3) * 4);
    printf("10 - 6 / 2    = %d\n", 10 - 6 / 2);
    printf("(10 - 6) / 2  = %d\n", (10 - 6) / 2);

    printf("\n=== Float expression: BMI ===\n");
    bmi = weight_kg / (height_m * height_m);
    printf("weight=%.1f kg, height=%.2f m  ->  BMI=%.1f\n",
           weight_kg, height_m, bmi);

    pause_at_exit();
    return 0;
}
