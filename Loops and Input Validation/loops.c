/*
 * Lesson 4 — Loops and Input Validation (primary demo)
 *
 * while / do while / for, break/continue ideas via helpers, sentinel input,
 * safe numeric reading with fgets + strtol, sum/average, and a for-loop table.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic loops.c -o loops.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

#define LINE_CAPACITY 128
#define SENTINEL (-999)

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

/*
 * read_int — reusable-style helper for validated integers.
 *
 * Why fgets first?
 *   scanf("%d") leaves a leftover newline and is awkward to recover from after
 *   bad input. fgets reads a whole line; then strtol parses it. On failure we
 *   simply discard that line and ask again — no leftover junk poisoning the
 *   next read.
 *
 * Returns 1 on success (stores into *out_value), 0 on EOF.
 */
static int read_int(const char *prompt, int *out_value)
{
    char line[LINE_CAPACITY];
    char *end = NULL;
    long parsed = 0L;

    for (;;) {
        printf("%s", prompt);
        if (fgets(line, (int)sizeof line, stdin) == NULL) {
            return 0; /* EOF */
        }

        /* If the line was too long, fgets filled the buffer without '\n'.
         * Drain the rest of the line so the next prompt starts clean. */
        if (strchr(line, '\n') == NULL) {
            int ch = 0;
            while ((ch = getchar()) != '\n' && ch != EOF) {
                /* discard */
            }
            printf("Input too long; try again.\n");
            continue;
        }

        errno = 0;
        parsed = strtol(line, &end, 10);
        if (end == line) {
            printf("Not an integer; try again.\n");
            continue;
        }
        if (errno == ERANGE) {
            printf("Number out of range; try again.\n");
            continue;
        }
        while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
            end++;
        }
        if (*end != '\0') {
            printf("Extra characters after the number; try again.\n");
            continue;
        }

        *out_value = (int)parsed;
        return 1;
    }
}

int main(void)
{
    int value = 0;
    int count = 0;
    int sum = 0;
    double average = 0.0;
    int row = 0;

    /* --- Sentinel loop with validation --- */
    printf("=== Enter integers (sentinel %d to stop) ===\n", SENTINEL);
    sum = 0;
    count = 0;

    /* while: test first, then body. Good when zero iterations are possible. */
    while (read_int("Number: ", &value)) {
        if (value == SENTINEL) {
            break; /* exit the loop early without counting the sentinel */
        }
        sum += value;
        count += 1;
    }

    if (count == 0) {
        printf("No numbers entered.\n");
    } else {
        average = (double)sum / (double)count;
        printf("Count=%d  Sum=%d  Average=%.2f\n", count, sum, average);
    }

    /* --- do while: body runs at least once --- */
    printf("\n=== do-while confirmation ===\n");
    do {
        if (!read_int("Enter 1 to continue: ", &value)) {
            pause_at_exit();
            return 1;
        }
        if (value != 1) {
            printf("Please enter exactly 1.\n");
        }
    } while (value != 1);

    /* --- for-loop table: init; condition; update ---
     * Off-by-one tip: decide whether the end is inclusive. Here 1..10 inclusive. */
    printf("\n=== Multiplication table for 7 (for-loop) ===\n");
    for (row = 1; row <= 10; row++) {
        printf("7 x %2d = %2d\n", row, 7 * row);
    }

    /* continue example: skip odd rows in a short listing */
    printf("\n=== Even multipliers only (continue) ===\n");
    for (row = 1; row <= 10; row++) {
        if (row % 2 != 0) {
            continue; /* skip the rest of this iteration */
        }
        printf("7 x %2d = %2d\n", row, 7 * row);
    }

    pause_at_exit();
    return 0;
}
