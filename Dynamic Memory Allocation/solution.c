/*
 * Lesson 11 — Exercise solutions
 *
 * Exercises (see README.md):
 *   1) Dynamic average: read N, allocate N doubles with malloc, compute average.
 *   2) Shrink with realloc: after building a list, trim capacity to count.
 *   3) Safe duplicate: copy an int array with malloc; free both independently.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int read_line(char *buffer, size_t size)
{
    if (buffer == NULL || size == 0U) {
        return 0;
    }
    if (fgets(buffer, (int)size, stdin) == NULL) {
        return 0;
    }
    buffer[strcspn(buffer, "\n")] = '\0';
    return 1;
}

static int parse_positive_int(const char *text, int *out_value)
{
    char *end = NULL;
    long value;

    if (text == NULL || out_value == NULL) {
        return 0;
    }
    while (*text == ' ' || *text == '\t') {
        text++;
    }
    if (*text == '\0') {
        return 0;
    }

    value = strtol(text, &end, 10);
    if (end == text) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    if (value < 1L || value > 100000L) {
        return 0;
    }

    *out_value = (int)value;
    return 1;
}

static int parse_double(const char *text, double *out_value)
{
    char *end = NULL;
    double value;

    if (text == NULL || out_value == NULL) {
        return 0;
    }
    while (*text == ' ' || *text == '\t') {
        text++;
    }
    if (*text == '\0') {
        return 0;
    }

    value = strtod(text, &end);
    if (end == text) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }

    *out_value = value;
    return 1;
}

/* Platform convenience — not a C language concept. */
static void pause_at_exit(void)
{
    char line[8];

    printf("\nPress Enter to exit...");
    fflush(stdout);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        /* ignore */
    }
}

/* ----- Exercise 1: average of N doubles ----- */

static void exercise_average(void)
{
    char line[128];
    int n;
    int i;
    double *values = NULL;
    double sum = 0.0;

    printf("\n=== Exercise 1: dynamic average ===\n");
    printf("How many values (1..100000)? ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_int(line, &n)) {
        printf("Invalid count — skipping exercise 1.\n");
        return;
    }

    values = malloc((size_t)n * sizeof *values);
    if (values == NULL) {
        fprintf(stderr, "malloc failed for %d doubles.\n", n);
        return;
    }

    for (i = 0; i < n; i++) {
        printf("value[%d]: ", i);
        fflush(stdout);
        if (!read_line(line, sizeof line) || !parse_double(line, &values[i])) {
            printf("Invalid number — treating as 0.0\n");
            values[i] = 0.0;
        }
        sum += values[i];
    }

    printf("Average of %d value(s): %.6f\n", n, sum / (double)n);

    free(values);
    values = NULL;
}

/* ----- Exercise 2: trim capacity with realloc ----- */

static void exercise_trim(void)
{
    int *data = NULL;
    size_t capacity = 8U;
    size_t count = 0U;
    size_t i;
    int *trimmed;

    printf("\n=== Exercise 2: shrink with realloc ===\n");

    data = malloc(capacity * sizeof *data);
    if (data == NULL) {
        fprintf(stderr, "malloc failed.\n");
        return;
    }

    /* Simulate filling only 3 of 8 slots. */
    data[0] = 10;
    data[1] = 20;
    data[2] = 30;
    count = 3U;

    printf("Before trim: count=%zu capacity=%zu ->", count, capacity);
    for (i = 0U; i < count; i++) {
        printf(" %d", data[i]);
    }
    printf("\n");

    /*
     * Shrink the allocation to exactly count elements.
     * If realloc fails, the original larger block remains valid.
     */
    trimmed = realloc(data, count * sizeof *data);
    if (trimmed == NULL) {
        fprintf(stderr, "realloc shrink failed — keeping original block.\n");
        free(data);
        data = NULL;
        return;
    }
    data = trimmed;
    capacity = count;

    printf("After trim:  count=%zu capacity=%zu ->", count, capacity);
    for (i = 0U; i < count; i++) {
        printf(" %d", data[i]);
    }
    printf("\n");

    free(data);
    data = NULL;
}

/* ----- Exercise 3: duplicate an array ----- */

static int *duplicate_ints(const int *src, size_t n)
{
    int *copy;
    size_t i;

    if (src == NULL || n == 0U) {
        return NULL;
    }

    copy = malloc(n * sizeof *copy);
    if (copy == NULL) {
        return NULL;
    }
    for (i = 0U; i < n; i++) {
        copy[i] = src[i];
    }
    return copy;
}

static void exercise_duplicate(void)
{
    const int original[] = {1, 2, 3, 4, 5};
    const size_t n = sizeof original / sizeof original[0];
    int *copy = NULL;
    size_t i;

    printf("\n=== Exercise 3: safe array duplicate ===\n");

    copy = duplicate_ints(original, n);
    if (copy == NULL) {
        fprintf(stderr, "duplicate failed.\n");
        return;
    }

    copy[0] = 99; /* mutate copy only */

    printf("original:");
    for (i = 0U; i < n; i++) {
        printf(" %d", original[i]);
    }
    printf("\ncopy:    ");
    for (i = 0U; i < n; i++) {
        printf(" %d", copy[i]);
    }
    printf("\n");

    free(copy);
    copy = NULL;
    /* original is stack storage — do not free it */
}

int main(void)
{
    printf("Lesson 11 — solution.c (exercise answers)\n");
    exercise_average();
    exercise_trim();
    exercise_duplicate();
    pause_at_exit();
    return 0;
}
