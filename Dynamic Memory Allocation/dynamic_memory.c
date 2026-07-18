/*
 * Lesson 11 — Dynamic Memory Allocation
 *
 * Demonstrates malloc, calloc, realloc, and free with a growable integer list.
 * Every allocation is checked; every block is freed; pointers are set to NULL
 * after free to reduce the chance of accidental reuse (use-after-free).
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic dynamic_memory.c -o dynamic_memory.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

/* -------------------------------------------------------------------------
 * Helpers: safe line input and pause-at-exit
 * ------------------------------------------------------------------------- */

/*
 * Read one line with fgets and strip the trailing newline if present.
 * Returns 1 on success, 0 on EOF or empty failure.
 * Never use gets() — it cannot bound the buffer and is removed from C11+.
 */
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

/*
 * Parse a non-negative integer from a line already read with fgets.
 * Rejects empty strings and leftover non-space junk after the number.
 */
static int parse_nonneg_int(const char *text, int *out_value)
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
    if (value < 0L || value > 2147483647L) {
        return 0;
    }

    *out_value = (int)value;
    return 1;
}

/*
 * Platform convenience: wait for Enter so a console window opened by
 * double-clicking an .exe on Windows does not close immediately.
 * This is not a C language concept — keep it separate from core logic.
 */
static void pause_at_exit(void)
{
    char line[8];

    printf("\nPress Enter to exit...");
    fflush(stdout);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        /* EOF: nothing else to do */
    }
}

/* -------------------------------------------------------------------------
 * Growable integer list (ownership lives in this module's helpers)
 * ------------------------------------------------------------------------- */

typedef struct {
    int *data;       /* heap array owned by this list; NULL when empty */
    size_t count;    /* number of elements currently stored */
    size_t capacity; /* allocated slots (>= count); 0 when data is NULL */
} IntList;

/*
 * Initialize an empty list. No heap allocation yet — first push will allocate.
 */
static void intlist_init(IntList *list)
{
    if (list == NULL) {
        return;
    }
    list->data = NULL;
    list->count = 0U;
    list->capacity = 0U;
}

/*
 * Release the heap block and reset the list to empty.
 * Safe to call on an already-empty list.
 * Pattern: free, then set the pointer to NULL so a later free(NULL) is a no-op
 * and accidental dereference is more likely to crash loudly than corrupt memory.
 */
static void intlist_free(IntList *list)
{
    if (list == NULL) {
        return;
    }
    free(list->data);
    list->data = NULL;
    list->count = 0U;
    list->capacity = 0U;
}

/*
 * Ensure capacity >= needed. Grows by doubling (or to needed if larger).
 * On failure, the original block is left intact (realloc semantics when we
 * assign only after a successful realloc). Returns 1 on success, 0 on failure.
 */
static int intlist_reserve(IntList *list, size_t needed)
{
    size_t new_cap;
    int *grown;

    if (list == NULL) {
        return 0;
    }
    if (needed <= list->capacity) {
        return 1;
    }

    new_cap = (list->capacity == 0U) ? 4U : list->capacity;
    while (new_cap < needed) {
        /* Cap growth to avoid wrapping size_t on pathological inputs. */
        if (new_cap > (SIZE_MAX / 2U)) {
            new_cap = needed;
            break;
        }
        new_cap *= 2U;
    }

    /*
     * realloc may move the block. Always capture the return value in a
     * temporary. If realloc fails it returns NULL and the old block remains
     * valid — so never overwrite list->data with NULL on failure.
     */
    grown = realloc(list->data, new_cap * sizeof *grown);
    if (grown == NULL) {
        fprintf(stderr, "Error: realloc failed (needed %zu ints).\n", needed);
        return 0;
    }

    list->data = grown;
    list->capacity = new_cap;
    return 1;
}

/*
 * Append one integer. Returns 1 on success, 0 if growth failed.
 */
static int intlist_push(IntList *list, int value)
{
    if (list == NULL) {
        return 0;
    }
    if (!intlist_reserve(list, list->count + 1U)) {
        return 0;
    }
    list->data[list->count] = value;
    list->count += 1U;
    return 1;
}

static void intlist_print(const IntList *list, const char *label)
{
    size_t i;

    if (list == NULL) {
        return;
    }
    printf("%s (count=%zu, capacity=%zu):",
           label != NULL ? label : "list",
           list->count,
           list->capacity);
    if (list->count == 0U) {
        printf(" <empty>\n");
        return;
    }
    for (i = 0U; i < list->count; i++) {
        printf(" %d", list->data[i]);
    }
    printf("\n");
}

/* -------------------------------------------------------------------------
 * calloc demonstration: zero-initialized block
 * ------------------------------------------------------------------------- */

/*
 * Allocate n ints with calloc so every element starts at 0.
 * Caller owns the returned pointer and must free it.
 * Returns NULL on failure (or if n == 0 — we treat 0 as "nothing to allocate").
 */
static int *make_zeroed_ints(size_t n)
{
    int *block;

    if (n == 0U) {
        return NULL;
    }

    /*
     * calloc(count, size) requests count * size bytes and zeros them.
     * Prefer calloc over malloc+memset when you need a zero-filled array.
     */
    block = calloc(n, sizeof *block);
    if (block == NULL) {
        fprintf(stderr, "Error: calloc failed for %zu ints.\n", n);
        return NULL;
    }
    return block;
}

/* -------------------------------------------------------------------------
 * Partial-failure cleanup demo: allocate several blocks; free all on error
 * ------------------------------------------------------------------------- */

/*
 * Allocate three small buffers. If any allocation fails, free whatever
 * succeeded so far and return 0. Success returns 1 and transfers ownership
 * of the three pointers to the caller via out-parameters.
 */
static int allocate_three_buffers(char **a, char **b, char **c)
{
    if (a == NULL || b == NULL || c == NULL) {
        return 0;
    }

    *a = NULL;
    *b = NULL;
    *c = NULL;

    *a = malloc(32U);
    if (*a == NULL) {
        fprintf(stderr, "Error: malloc failed for buffer A.\n");
        return 0;
    }

    *b = malloc(32U);
    if (*b == NULL) {
        fprintf(stderr, "Error: malloc failed for buffer B — cleaning up A.\n");
        free(*a);
        *a = NULL;
        return 0;
    }

    *c = malloc(32U);
    if (*c == NULL) {
        fprintf(stderr, "Error: malloc failed for buffer C — cleaning up A and B.\n");
        free(*a);
        free(*b);
        *a = NULL;
        *b = NULL;
        return 0;
    }

    /* Mark buffers so we can see them in the demo output. */
    (void)snprintf(*a, 32, "alpha");
    (void)snprintf(*b, 32, "bravo");
    (void)snprintf(*c, 32, "charlie");
    return 1;
}

/* -------------------------------------------------------------------------
 * main: interactive growable list + demos
 * ------------------------------------------------------------------------- */

int main(void)
{
    IntList list;
    char line[128];
    int value;
    int *zeros = NULL;
    size_t i;
    char *buf_a = NULL;
    char *buf_b = NULL;
    char *buf_c = NULL;

    printf("=== Lesson 11: Dynamic Memory Allocation ===\n\n");
    printf("Build a growable list of integers.\n");
    printf("Enter non-negative integers one per line.\n");
    printf("Enter -1 (or a blank line) when finished.\n\n");

    intlist_init(&list);

    for (;;) {
        printf("value (or -1 to stop): ");
        fflush(stdout);
        if (!read_line(line, sizeof line)) {
            printf("\n(EOF — stopping input.)\n");
            break;
        }
        if (line[0] == '\0') {
            break;
        }

        /* Allow -1 as a sentinel without using parse_nonneg_int. */
        if (strcmp(line, "-1") == 0) {
            break;
        }

        if (!parse_nonneg_int(line, &value)) {
            printf("  Invalid input — enter a non-negative integer or -1.\n");
            continue;
        }

        if (!intlist_push(&list, value)) {
            printf("  Could not grow the list — stopping input.\n");
            break;
        }
        intlist_print(&list, "  current");
    }

    printf("\n--- Final growable list ---\n");
    intlist_print(&list, "values");

    /* Sum using the dynamic array (ownership still with list). */
    {
        long sum = 0L;
        for (i = 0U; i < list.count; i++) {
            sum += list.data[i];
        }
        printf("Sum of %zu value(s): %ld\n", list.count, sum);
    }

    printf("\n--- calloc demo (5 zeroed ints) ---\n");
    zeros = make_zeroed_ints(5U);
    if (zeros != NULL) {
        printf("calloc block:");
        for (i = 0U; i < 5U; i++) {
            printf(" %d", zeros[i]);
        }
        printf("\n");
        zeros[2] = 42;
        printf("after zeros[2] = 42:");
        for (i = 0U; i < 5U; i++) {
            printf(" %d", zeros[i]);
        }
        printf("\n");
        free(zeros);
        zeros = NULL; /* NULL-after-free pattern */
    }

    printf("\n--- partial-failure cleanup demo ---\n");
    if (allocate_three_buffers(&buf_a, &buf_b, &buf_c)) {
        printf("Allocated: \"%s\", \"%s\", \"%s\"\n", buf_a, buf_b, buf_c);
        free(buf_a);
        free(buf_b);
        free(buf_c);
        buf_a = NULL;
        buf_b = NULL;
        buf_c = NULL;
        printf("All three buffers freed.\n");
    }

    /*
     * Always free the list before exit. Double-free is undefined behavior —
     * intlist_free sets data to NULL, so a second call is safe.
     */
    intlist_free(&list);
    intlist_free(&list); /* intentional second call: shows free(NULL) safety */

    printf("\nList freed. Ownership ended; do not use list.data after this.\n");

    pause_at_exit();
    return 0;
}
