/*
 * Lesson 4 — Loops and Input Validation (reference solution)
 *
 * Exercises:
 *   1) Factorial with input validation
 *   2) Number-guessing loop
 *   3) Print only even numbers using continue
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

#define LINE_CAPACITY 128

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

static int read_int(const char *prompt, int *out_value)
{
    char line[LINE_CAPACITY];
    char *end = NULL;
    long parsed = 0L;

    for (;;) {
        printf("%s", prompt);
        if (fgets(line, (int)sizeof line, stdin) == NULL) {
            return 0;
        }
        if (strchr(line, '\n') == NULL) {
            int ch = 0;
            while ((ch = getchar()) != '\n' && ch != EOF) {
            }
            printf("Input too long; try again.\n");
            continue;
        }

        errno = 0;
        parsed = strtol(line, &end, 10);
        if (end == line || errno == ERANGE) {
            printf("Invalid integer; try again.\n");
            continue;
        }
        while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
            end++;
        }
        if (*end != '\0') {
            printf("Extra characters; try again.\n");
            continue;
        }

        *out_value = (int)parsed;
        return 1;
    }
}

int main(void)
{
    int n = 0;
    int i = 0;
    long long factorial = 1LL;
    int secret = 7; /* fixed for a predictable demo; swap for rand later */
    int guess = 0;
    int attempts = 0;

    /* --- Exercise 1: factorial with validation --- */
    printf("=== Factorial ===\n");
    for (;;) {
        if (!read_int("Enter n (0..20): ", &n)) {
            pause_at_exit();
            return 1;
        }
        if (n < 0 || n > 20) {
            printf("Out of allowed range.\n");
            continue;
        }
        break;
    }

    factorial = 1LL;
    for (i = 2; i <= n; i++) {
        factorial *= i;
    }
    printf("%d! = %lld\n", n, factorial);

    /* --- Exercise 2: guess the number --- */
    printf("\n=== Guess the number (1-10) ===\n");
    attempts = 0;
    do {
        if (!read_int("Your guess: ", &guess)) {
            pause_at_exit();
            return 1;
        }
        attempts += 1;
        if (guess < secret) {
            printf("Too low.\n");
        } else if (guess > secret) {
            printf("Too high.\n");
        }
    } while (guess != secret);

    printf("Correct in %d attempt(s)!\n", attempts);

    /* --- Exercise 3: even numbers with continue --- */
    printf("\n=== Even numbers from 1 to 20 ===\n");
    for (i = 1; i <= 20; i++) {
        if (i % 2 != 0) {
            continue;
        }
        printf("%d ", i);
    }
    printf("\n");

    pause_at_exit();
    return 0;
}
