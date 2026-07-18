/*
 * Lesson 6 — Arrays
 *
 * Goal: store a fixed maximum number of scores, then compute totals,
 * min, max, and average with helper functions that take (array, length).
 *
 * WHY arrays matter: a separate variable for every score does not scale.
 * An array is one name for many same-type values, indexed from 0.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic arrays.c -o arrays.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_SCORES 20
#define LINE_SIZE 128

/* Windows-console convenience: keeps a double-clicked window open.
 * Not a C language concept — separate from core lesson logic. */
static void pause_at_exit(void)
{
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

/* Read one line and parse an integer in [min_value, max_value].
 * Returns 1 on success, 0 on failure (keeps retrying in callers). */
static int read_int_in_range(const char *prompt, int min_value, int max_value,
                             int *out_value)
{
    char line[LINE_SIZE];
    char *end = NULL;
    long parsed = 0;

    if (out_value == NULL) {
        return 0;
    }

    printf("%s", prompt);
    fflush(stdout);

    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        return 0;
    }

    /* strtol skips leading whitespace and reports where parsing stopped. */
    parsed = strtol(line, &end, 10);
    if (end == line) {
        return 0; /* no digits at all */
    }
    while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
        end++;
    }
    if (*end != '\0') {
        return 0; /* trailing junk like "12abc" */
    }
    if (parsed < min_value || parsed > max_value) {
        return 0;
    }

    *out_value = (int)parsed;
    return 1;
}

/* Arrays decay to pointers when passed to functions: the callee receives
 * &scores[0], NOT a full copy of the array. That is WHY we also pass
 * length — the function cannot know how many valid elements exist. */
static int sum_scores(const int scores[], int length)
{
    int total = 0;
    int i = 0;

    for (i = 0; i < length; i++) {
        total += scores[i];
    }
    return total;
}

static int find_min(const int scores[], int length)
{
    int min_value = 0;
    int i = 0;

    /* Caller must guarantee length >= 1. */
    min_value = scores[0];
    for (i = 1; i < length; i++) {
        if (scores[i] < min_value) {
            min_value = scores[i];
        }
    }
    return min_value;
}

static int find_max(const int scores[], int length)
{
    int max_value = 0;
    int i = 0;

    max_value = scores[0];
    for (i = 1; i < length; i++) {
        if (scores[i] > max_value) {
            max_value = scores[i];
        }
    }
    return max_value;
}

static double average_scores(const int scores[], int length)
{
    /* Cast to double so we get a fractional mean, not integer division. */
    return (double)sum_scores(scores, length) / (double)length;
}

static void print_scores(const int scores[], int length)
{
    int i = 0;

    printf("Scores:");
    for (i = 0; i < length; i++) {
        printf(" %d", scores[i]);
    }
    printf("\n");
}

int main(void)
{
    /* Fixed-capacity array: room for MAX_SCORES ints.
     * count tracks how many slots are actually used (0 .. MAX_SCORES). */
    int scores[MAX_SCORES];
    int count = 0;
    int requested = 0;
    int i = 0;
    int value = 0;

    /* Zero-initialize so unused slots are defined if we print them by mistake. */
    for (i = 0; i < MAX_SCORES; i++) {
        scores[i] = 0;
    }

    printf("=== Lesson 6: Arrays ===\n");
    printf("Enter how many scores to store (1-%d).\n", MAX_SCORES);

    while (!read_int_in_range("Count: ", 1, MAX_SCORES, &requested)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            pause_at_exit();
            return 1;
        }
        printf("Please enter an integer between 1 and %d.\n", MAX_SCORES);
    }
    count = requested;

    printf("Enter %d score(s) from 0 to 100.\n", count);
    for (i = 0; i < count; i++) {
        char prompt[64];

        /* Bounds: we only write scores[0] .. scores[count-1], never past
         * scores[MAX_SCORES-1]. Going past the end is undefined behavior. */
        (void)snprintf(prompt, sizeof prompt, "Score %d: ", i + 1);
        while (!read_int_in_range(prompt, 0, 100, &value)) {
            if (feof(stdin)) {
                fprintf(stderr, "End of input.\n");
                pause_at_exit();
                return 1;
            }
            printf("Invalid score. Use 0..100.\n");
        }
        scores[i] = value;
    }

    print_scores(scores, count);
    printf("Sum:     %d\n", sum_scores(scores, count));
    printf("Min:     %d\n", find_min(scores, count));
    printf("Max:     %d\n", find_max(scores, count));
    printf("Average: %.2f\n", average_scores(scores, count));

    /* Demo: initializer list (size inferred from the list). */
    {
        int demo[] = {10, 20, 30, 40};
        int demo_len = (int)(sizeof demo / sizeof demo[0]);

        printf("\nInitializer demo (%d elements):", demo_len);
        print_scores(demo, demo_len);
    }

    pause_at_exit();
    return 0;
}
