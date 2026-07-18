/*
 * Lesson 13 — Exercise solutions
 *
 * Exercises (see README.md):
 *   1) Count occurrences of a target with a linear scan.
 *   2) Sort ascending with insertion sort, then binary-search a value.
 *   3) Detect whether an array is already sorted ascending.
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

static int parse_int(const char *text, int *out_value)
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
    if (value < -2147483647L - 1L || value > 2147483647L) {
        return 0;
    }

    *out_value = (int)value;
    return 1;
}

static void print_array(const char *label, const int *a, size_t n)
{
    size_t i;

    printf("%s:", label);
    for (i = 0U; i < n; i++) {
        printf(" %d", a[i]);
    }
    printf("\n");
}

static size_t count_occurrences(const int *a, size_t n, int target)
{
    size_t i;
    size_t count = 0U;

    if (a == NULL) {
        return 0U;
    }
    for (i = 0U; i < n; i++) {
        if (a[i] == target) {
            count += 1U;
        }
    }
    return count;
}

static void insertion_sort_asc(int *a, size_t n)
{
    size_t i;

    if (a == NULL || n < 2U) {
        return;
    }
    for (i = 1U; i < n; i++) {
        int key = a[i];
        size_t j = i;
        while (j > 0U && a[j - 1U] > key) {
            a[j] = a[j - 1U];
            j -= 1U;
        }
        a[j] = key;
    }
}

static int binary_search_asc(const int *a, size_t n, int target)
{
    size_t lo = 0U;
    size_t hi;

    if (a == NULL || n == 0U) {
        return -1;
    }
    hi = n - 1U;
    while (lo <= hi) {
        size_t mid = lo + (hi - lo) / 2U;
        if (a[mid] == target) {
            return (int)mid;
        }
        if (a[mid] < target) {
            lo = mid + 1U;
        } else {
            if (mid == 0U) {
                break;
            }
            hi = mid - 1U;
        }
    }
    return -1;
}

static int is_sorted_asc(const int *a, size_t n)
{
    size_t i;

    if (a == NULL || n < 2U) {
        return 1;
    }
    for (i = 1U; i < n; i++) {
        if (a[i - 1U] > a[i]) {
            return 0;
        }
    }
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

int main(void)
{
    int data[] = {5, 1, 5, 9, 5, 3, 8};
    const size_t n = sizeof data / sizeof data[0];
    int work[sizeof data / sizeof data[0]];
    char line[128];
    int target;
    size_t i;
    int idx;

    printf("Lesson 13 — solution.c (exercise answers)\n");
    print_array("Sample", data, n);

    printf("\n=== Exercise 1: count occurrences ===\n");
    printf("Target to count: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_int(line, &target)) {
        target = 5;
        printf("(using default target 5)\n");
    }
    printf("Count of %d: %zu\n", target, count_occurrences(data, n, target));

    printf("\n=== Exercise 2: insertion sort then binary search ===\n");
    for (i = 0U; i < n; i++) {
        work[i] = data[i];
    }
    insertion_sort_asc(work, n);
    print_array("Sorted ASC", work, n);
    printf("Value to find: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_int(line, &target)) {
        target = 9;
        printf("(using default target 9)\n");
    }
    idx = binary_search_asc(work, n, target);
    if (idx >= 0) {
        printf("Found %d at index %d\n", target, idx);
    } else {
        printf("%d not found\n", target);
    }

    printf("\n=== Exercise 3: sorted check ===\n");
    printf("Original sorted? %s\n", is_sorted_asc(data, n) ? "yes" : "no");
    printf("Work sorted?     %s\n", is_sorted_asc(work, n) ? "yes" : "no");

    pause_at_exit();
    return 0;
}
