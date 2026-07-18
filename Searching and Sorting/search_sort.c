/*
 * Lesson 13 — Searching and Sorting
 *
 * Demonstrates linear search, binary search (on sorted data), bubble sort,
 * and insertion sort on a small int array, with clear printed results.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic search_sort.c -o search_sort.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum SortOrder {
    SORT_ASC = 0,
    SORT_DESC = 1
};

static void print_array(const char *label, const int *a, size_t n)
{
    size_t i;

    if (label != NULL && label[0] != '\0') {
        printf("%s:", label);
    }
    if (a == NULL || n == 0U) {
        printf(" <empty>\n");
        return;
    }
    for (i = 0U; i < n; i++) {
        printf(" %d", a[i]);
    }
    printf("\n");
}

static void copy_array(int *dest, const int *src, size_t n)
{
    size_t i;

    if (dest == NULL || src == NULL) {
        return;
    }
    for (i = 0U; i < n; i++) {
        dest[i] = src[i];
    }
}

/*
 * Linear search: scan every element.
 * Beginner Big-O: O(n) time — work grows with the number of elements.
 * Returns the index of the first match, or -1 if not found.
 */
static int linear_search(const int *a, size_t n, int target)
{
    size_t i;

    if (a == NULL) {
        return -1;
    }
    for (i = 0U; i < n; i++) {
        printf("  linear: check index %zu (value %d)\n", i, a[i]);
        if (a[i] == target) {
            return (int)i;
        }
    }
    return -1;
}

/*
 * Binary search: requires ascending sorted order.
 * Beginner Big-O: O(log n) time — each step halves the remaining range.
 * Returns index of a match, or -1 if not found.
 */
static int binary_search(const int *a, size_t n, int target)
{
    size_t lo = 0U;
    size_t hi;

    if (a == NULL || n == 0U) {
        return -1;
    }

    hi = n - 1U;
    while (lo <= hi) {
        size_t mid = lo + (hi - lo) / 2U;

        printf("  binary: lo=%zu hi=%zu mid=%zu (value %d)\n",
               lo, hi, mid, a[mid]);

        if (a[mid] == target) {
            return (int)mid;
        }
        if (a[mid] < target) {
            lo = mid + 1U;
        } else {
            /*
             * Careful when mid == 0: subtracting 1 from size_t would wrap.
             * If mid is 0 and target is smaller, the value is not present.
             */
            if (mid == 0U) {
                break;
            }
            hi = mid - 1U;
        }
    }
    return -1;
}

static void swap_ints(int *x, int *y)
{
    int tmp;

    if (x == NULL || y == NULL) {
        return;
    }
    tmp = *x;
    *x = *y;
    *y = tmp;
}

/*
 * Bubble sort: repeatedly swap adjacent out-of-order pairs.
 * Teaching algorithm — easy to visualize, not chosen for large data.
 * Beginner Big-O: O(n^2) comparisons in the typical nested-loop form.
 */
static void bubble_sort(int *a, size_t n, enum SortOrder order)
{
    size_t i;
    size_t j;
    int swapped;

    if (a == NULL || n < 2U) {
        return;
    }

    for (i = 0U; i < n - 1U; i++) {
        swapped = 0;
        for (j = 0U; j < n - 1U - i; j++) {
            int out_of_order = (order == SORT_ASC)
                                   ? (a[j] > a[j + 1U])
                                   : (a[j] < a[j + 1U]);
            if (out_of_order) {
                swap_ints(&a[j], &a[j + 1U]);
                swapped = 1;
            }
        }
        printf("  bubble pass %zu: ", i + 1U);
        print_array("", a, n);
        if (!swapped) {
            printf("  (early exit — already ordered)\n");
            break;
        }
    }
}

/*
 * Insertion sort: grow a sorted prefix by inserting each next element.
 * Often practical for small or nearly-sorted arrays.
 * Beginner Big-O: O(n^2) worst case, but fewer moves when data is almost sorted.
 */
static void insertion_sort(int *a, size_t n, enum SortOrder order)
{
    size_t i;

    if (a == NULL || n < 2U) {
        return;
    }

    for (i = 1U; i < n; i++) {
        int key = a[i];
        size_t j = i;

        while (j > 0U) {
            int should_shift = (order == SORT_ASC)
                                   ? (a[j - 1U] > key)
                                   : (a[j - 1U] < key);
            if (!should_shift) {
                break;
            }
            a[j] = a[j - 1U];
            j -= 1U;
        }
        a[j] = key;
        printf("  insertion after i=%zu: ", i);
        print_array("", a, n);
    }
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
    const int sample[] = {42, 7, 19, 3, 42, 11};
    const size_t n = sizeof sample / sizeof sample[0];
    int work[sizeof sample / sizeof sample[0]];
    int idx;
    const int target = 19;

    printf("=== Lesson 13: Searching and Sorting ===\n\n");
    print_array("Original", sample, n);

    printf("\n--- Linear search for %d ---\n", target);
    idx = linear_search(sample, n, target);
    if (idx >= 0) {
        printf("Found %d at index %d\n", target, idx);
    } else {
        printf("%d not found\n", target);
    }

    printf("\n--- Bubble sort ascending (teaching) ---\n");
    copy_array(work, sample, n);
    bubble_sort(work, n, SORT_ASC);
    print_array("Bubble result", work, n);

    printf("\n--- Binary search for %d (requires sorted ascending) ---\n", target);
    idx = binary_search(work, n, target);
    if (idx >= 0) {
        printf("Found %d at index %d\n", target, idx);
    } else {
        printf("%d not found\n", target);
    }

    printf("\n--- Insertion sort descending ---\n");
    copy_array(work, sample, n);
    insertion_sort(work, n, SORT_DESC);
    print_array("Insertion result", work, n);

    printf("\n--- Bubble sort descending ---\n");
    copy_array(work, sample, n);
    bubble_sort(work, n, SORT_DESC);
    print_array("Bubble DESC result", work, n);

    printf("\nBig-O (beginner intuition):\n");
    printf("  linear search ~ O(n)      — look at more items as n grows\n");
    printf("  binary search ~ O(log n)  — halve the range each step (sorted!)\n");
    printf("  bubble/insertion ~ O(n^2) — nested loops over pairs/prefix\n");

    pause_at_exit();
    return 0;
}
