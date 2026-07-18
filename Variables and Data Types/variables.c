/*
 * Lesson 1 — Variables and Data Types (primary demo)
 *
 * Goals: see program structure, declare/initialize common types, print them
 * with the right format specifiers, observe sizeof, and try a few conversions.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic variables.c -o variables.exe
 * Run (Windows):
 *   variables.exe
 */

#include <stdio.h>

/* Named constant via #define: replaced by the preprocessor before compilation.
 * Useful for fixed values that never change and need no storage of their own. */
#define PI_APPROX 3.14159

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Not part of the core lesson. On Windows, a double-clicked console window
 * often closes when main returns; waiting for Enter keeps the output visible.
 * On Linux/macOS, getchar() works the same way. Prefer this portable Enter
 * wait over relying only on system("pause").
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    /* Drain any leftover characters, then wait for a final Enter if needed. */
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

int main(void)
{
    /* Always initialize. Uninitialized locals hold indeterminate values. */
    char letter = 'A';
    int whole_number = 42;
    float single_precision = 3.14f;   /* trailing f marks a float literal */
    double double_precision = 2.718281828;

    /* const: typed constant the compiler can enforce (cannot reassign). */
    const int days_in_week = 7;

    /* Conversion examples: explicit casts document intent; implicit ones
     * still happen, but beginners should prefer being clear. */
    int truncated_pi = (int)PI_APPROX;           /* fractional part discarded */
    double promoted_int = (double)whole_number;  /* int widened to double */
    char digit_char = (char)('0' + 5);           /* '0'..'9' are consecutive */

    printf("=== Common types and format specifiers ===\n");
    printf("char   letter            = '%c'  (%%c)\n", letter);
    printf("int    whole_number      = %d    (%%d)\n", whole_number);
    printf("float  single_precision  = %.2f  (%%.2f)\n", single_precision);
    printf("double double_precision  = %.6f  (%%.6f)\n", double_precision);
    printf("const  days_in_week      = %d\n", days_in_week);
    printf("#define PI_APPROX        = %.5f\n", PI_APPROX);

    printf("\n=== sizeof (bytes on this machine/ABI) ===\n");
    /* sizeof yields size_t; %zu is the portable format for size_t. */
    printf("sizeof(char)   = %zu\n", sizeof(char));
    printf("sizeof(int)    = %zu\n", sizeof(int));
    printf("sizeof(float)  = %zu\n", sizeof(float));
    printf("sizeof(double) = %zu\n", sizeof(double));

    printf("\n=== Simple conversions ===\n");
    printf("(int)PI_APPROX        = %d  (truncated toward zero)\n", truncated_pi);
    printf("(double)whole_number  = %.1f\n", promoted_int);
    printf("'0' + 5 as char       = '%c'\n", digit_char);

    printf("\n=== Mixing float and double in printf ===\n");
    /* printf promotes float arguments to double; %%f / %%lf both work for
     * printing doubles in practice, but matching types still builds good habits. */
    printf("float printed with %%f : %.4f\n", single_precision);
    printf("double printed with %%f: %.4f\n", double_precision);

    pause_at_exit();
    return 0;
}
