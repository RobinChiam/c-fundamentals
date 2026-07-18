/*
 * Lesson 8 — Pointers
 *
 * Goal: use addresses and dereference to swap values, return multiple results
 * through out-parameters, walk an array with a pointer, and see the difference
 * between const int * and int * const.
 *
 * WHY pointers: functions receive copies of arguments. To change the caller's
 * variables (or avoid copying large data), pass their addresses.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic pointers.c -o pointers.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define LINE_SIZE 128
#define DATA_COUNT 5

/* Windows-console convenience — not a C language concept. */
static void pause_at_exit(void)
{
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

    *out_value = (int)parsed;
    return 1;
}

/* Swap two ints in the caller by exchanging the objects behind the pointers. */
static void swap_ints(int *a, int *b)
{
    int temp = 0;

    if (a == NULL || b == NULL) {
        return;
    }
    temp = *a;
    *a = *b;
    *b = temp;
}

/* Out-parameters: write results through pointers so one function can return
 * both min and max without packing them into a struct (yet). */
static int min_max(const int values[], int length, int *out_min, int *out_max)
{
    int i = 0;
    int min_value = 0;
    int max_value = 0;

    if (values == NULL || length <= 0 || out_min == NULL || out_max == NULL) {
        return 0;
    }

    min_value = values[0];
    max_value = values[0];
    for (i = 1; i < length; i++) {
        if (values[i] < min_value) {
            min_value = values[i];
        }
        if (values[i] > max_value) {
            max_value = values[i];
        }
    }

    *out_min = min_value;
    *out_max = max_value;
    return 1;
}

/* Walk with pointer arithmetic: p starts at &values[0], ends at values+length.
 * values[i] is defined to mean *(values + i). */
static void print_with_pointer(const int *values, int length)
{
    const int *p = NULL;
    const int *end = NULL;

    if (values == NULL || length <= 0) {
        return;
    }

    end = values + length;
    printf("Pointer walk:");
    for (p = values; p < end; p++) {
        printf(" %d", *p);
    }
    printf("\n");
}

static void demo_const_pointers(void)
{
    int x = 10;
    int y = 20;
    const int *p_to_const = &x; /* pointer to const int: cannot change *p */
    int *const const_p = &x;    /* const pointer: cannot make p point elsewhere */

    printf("\n--- const correctness demo ---\n");
    printf("x=%d y=%d\n", x, y);

    /* *p_to_const = 99; */ /* ILLEGAL: points to const int */
    p_to_const = &y;        /* OK: pointer itself may move */
    printf("p_to_const now views y -> %d\n", *p_to_const);

    *const_p = 42;          /* OK: may change the int through const_p */
    /* const_p = &y; */     /* ILLEGAL: pointer address is fixed */
    printf("const_p still points at x, now %d\n", *const_p);

    /*
     * Reading tip:
     *   const int *p     = "read-only pointee, movable pointer"
     *   int *const p     = "mutable pointee, fixed pointer"
     *   const int *const p = both fixed
     */
}

int main(void)
{
    int left = 0;
    int right = 0;
    int data[DATA_COUNT];
    int i = 0;
    int min_value = 0;
    int max_value = 0;
    int *nullable = NULL; /* always initialize pointers; NULL means "no object" */

    for (i = 0; i < DATA_COUNT; i++) {
        data[i] = 0;
    }

    printf("=== Lesson 8: Pointers ===\n");
    printf("Addresses use & ; dereference uses * .\n");

    while (!read_int("Enter left integer: ", &left)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            pause_at_exit();
            return 1;
        }
        printf("Invalid integer.\n");
    }
    while (!read_int("Enter right integer: ", &right)) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            pause_at_exit();
            return 1;
        }
        printf("Invalid integer.\n");
    }

    printf("Before swap: left=%d right=%d\n", left, right);
    printf("Addresses:   &left=%p &right=%p\n",
           (void *)&left, (void *)&right);
    swap_ints(&left, &right);
    printf("After swap:  left=%d right=%d\n", left, right);

    printf("\nEnter %d integers for min/max:\n", DATA_COUNT);
    for (i = 0; i < DATA_COUNT; i++) {
        char prompt[64];

        (void)snprintf(prompt, sizeof prompt, "data[%d]: ", i);
        while (!read_int(prompt, &data[i])) {
            if (feof(stdin)) {
                fprintf(stderr, "End of input.\n");
                pause_at_exit();
                return 1;
            }
            printf("Invalid integer.\n");
        }
    }

    /* Array name decays to &data[0] when passed to a pointer parameter. */
    if (min_max(data, DATA_COUNT, &min_value, &max_value)) {
        printf("min=%d max=%d\n", min_value, max_value);
    }
    print_with_pointer(data, DATA_COUNT);

    if (nullable == NULL) {
        printf("\nNULL check: nullable has no target (safe to test before *).\n");
    }

    demo_const_pointers();

    pause_at_exit();
    return 0;
}
