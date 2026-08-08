/*
 * Lesson 8 — Pointers (reference solution for README exercises)
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define LINE_SIZE 128
#define MAX_N 32

static void pause_at_exit(void)
{
    /* Platform convenience for Windows consoles — not core C logic. */
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

static int read_int(const char *prompt, int *out_value)
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
    parsed = strtol(line, &end, 10);
    if (end == line) {
        return 0;
    }
    while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    if (parsed < (long)INT_MIN || parsed > (long)INT_MAX) {
        return 0;
    }
    *out_value = (int)parsed;
    return 1;
}

/* Exercise 1: set *out to abs(*value); return 0 if any pointer is NULL. */
static int absolute_via_pointer(const int *value, int *out)
{
    if (value == NULL || out == NULL) {
        return 0;
    }
    *out = (*value < 0) ? -(*value) : *value;
    return 1;
}

/* Exercise 2: reverse an array in place using two moving pointers. */
static void reverse_with_pointers(int *values, int length)
{
    int *left = NULL;
    int *right = NULL;
    int temp = 0;

    if (values == NULL || length <= 1) {
        return;
    }

    left = values;
    right = values + (length - 1);
    while (left < right) {
        temp = *left;
        *left = *right;
        *right = temp;
        left++;
        right--;
    }
}

/* Exercise 3: sum via pointer walk; return 0 on bad args. */
static int sum_with_pointer(const int *values, int length, long *out_sum)
{
    const int *p = NULL;
    const int *end = NULL;
    long total = 0;

    if (values == NULL || length < 0 || out_sum == NULL) {
        return 0;
    }

    end = values + length;
    for (p = values; p < end; p++) {
        total += *p;
    }
    *out_sum = total;
    return 1;
}

int main(void)
{
    int values[MAX_N];
    int count = 0;
    int i = 0;
    int sample = 0;
    int abs_value = 0;
    long total = 0;

    for (i = 0; i < MAX_N; i++) {
        values[i] = 0;
    }

    printf("=== Lesson 8 solution: pointer exercises ===\n");

    while (!read_int("Integer for absolute_via_pointer: ", &sample)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Invalid integer.\n");
    }
    if (absolute_via_pointer(&sample, &abs_value)) {
        printf("abs(%d) = %d\n", sample, abs_value);
    }

    while (!read_int("How many values to reverse (1-32)? ", &count) ||
           count < 1 || count > MAX_N) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }

        printf("Enter 1..%d.\n", MAX_N);
        count = 0;
    }

    for (i = 0; i < count; i++) {
        char prompt[64];

        (void)snprintf(prompt, sizeof prompt, "values[%d]: ", i);
        while (!read_int(prompt, &values[i])) {
            if (feof(stdin)) {
                fprintf(stderr, "End of input.\n");
                break;
            }
            printf("Invalid integer.\n");
        }
    }

    reverse_with_pointers(values, count);
    printf("Reversed:");
    for (i = 0; i < count; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");

    if (sum_with_pointer(values, count, &total)) {
        printf("Sum via pointer walk: %ld\n", total);
    }

    pause_at_exit();
    return 0;
}
