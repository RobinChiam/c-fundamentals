/*
 * Lesson 6 — Arrays (reference solution for README exercises)
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_VALUES 32
#define LINE_SIZE 128

static void pause_at_exit(void)
{
    /* Platform convenience for Windows consoles — not core C logic. */
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

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
    if (parsed < min_value || parsed > max_value) {
        return 0;
    }

    *out_value = (int)parsed;
    return 1;
}

/* Exercise 1: reverse copy into another array (same length). */
static void reverse_copy(const int src[], int dest[], int length)
{
    int i = 0;

    for (i = 0; i < length; i++) {
        dest[i] = src[length - 1 - i];
    }
}

/* Exercise 2: count how many values are strictly above a threshold. */
static int count_above(const int values[], int length, int threshold)
{
    int i = 0;
    int found = 0;

    for (i = 0; i < length; i++) {
        if (values[i] > threshold) {
            found++;
        }
    }
    return found;
}

/* Exercise 3: linear search; return index or -1 if not found. */
static int find_value(const int values[], int length, int target)
{
    int i = 0;

    for (i = 0; i < length; i++) {
        if (values[i] == target) {
            return i;
        }
    }
    return -1;
}

static void print_array(const char *label, const int values[], int length)
{
    int i = 0;

    printf("%s", label);
    for (i = 0; i < length; i++) {
        printf(" %d", values[i]);
    }
    printf("\n");
}

int main(void)
{
    int values[MAX_VALUES];
    int reversed[MAX_VALUES];
    int count = 0;
    int i = 0;
    int value = 0;
    int threshold = 0;
    int target = 0;
    int index = -1;

    for (i = 0; i < MAX_VALUES; i++) {
        values[i] = 0;
        reversed[i] = 0;
    }

    printf("=== Lesson 6 solution: array exercises ===\n");

    while (!read_int_in_range("How many integers (1-32)? ", 1, MAX_VALUES,
                              &count)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter an integer from 1 to %d.\n", MAX_VALUES);
    }

    for (i = 0; i < count; i++) {
        char prompt[64];

        (void)snprintf(prompt, sizeof prompt, "value[%d]: ", i);
        while (!read_int_in_range(prompt, -1000000, 1000000, &value)) {
            if (feof(stdin)) {
                fprintf(stderr, "End of input.\n");
                break;
            }
            printf("Enter a valid integer.\n");
        }
        values[i] = value;
    }

    reverse_copy(values, reversed, count);
    print_array("Original:", values, count);
    print_array("Reversed:", reversed, count);

    while (!read_int_in_range("Threshold for count_above: ", -1000000, 1000000,
                              &threshold)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter a valid integer.\n");
    }
    printf("Count above %d: %d\n", threshold,
           count_above(values, count, threshold));

    while (!read_int_in_range("Search for value: ", -1000000, 1000000,
                              &target)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter a valid integer.\n");
    }
    index = find_value(values, count, target);
    if (index >= 0) {
        printf("Found %d at index %d.\n", target, index);
    } else {
        printf("%d was not found.\n", target);
    }

    pause_at_exit();
    return 0;
}
