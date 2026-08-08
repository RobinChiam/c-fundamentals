# Lesson 6: Arrays

**Difficulty:** Intermediate  
**Prerequisites:** [Functions and Scope](../Functions%20and%20Scope/)

## Learning objectives

- Declare, initialize, and index fixed-size arrays
- Traverse arrays safely with a separate length variable
- Pass arrays to functions (understand array-to-pointer decay)
- Compute aggregates: sum, min, max, average
- Avoid out-of-bounds access

## Concepts (plain language)

An **array** is a contiguous block of same-type values under one name. The first element is at index `0`, the last valid index is `length - 1`.

When you pass an array to a function, C does **not** copy every element. The function receives a pointer to the first element. That is why helpers take both the array and an explicit **length**.

Always track capacity (how much room the array has) separately from count (how many slots you have filled). Never write past `capacity - 1`.

## Important syntax

```c
int scores[20];                 /* fixed capacity */
int demo[] = {10, 20, 30};      /* size from initializer */
scores[i] = 95;                 /* store */
value = scores[i];              /* load */

int sum_scores(const int scores[], int length);  /* decay + length */
```

`sizeof scores / sizeof scores[0]` gives element count **only** for a real array in the same scope — not for a function parameter (which has already decayed).

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic arrays.c -o arrays.exe
arrays.exe
```

## Example interaction

```text
=== Lesson 6: Arrays ===
Enter how many scores to store (1-20).
Count: 3
Enter 3 score(s) from 0 to 100.
Score 1: 80
Score 2: 90
Score 3: 70
Scores: 80 90 70
Sum:     240
Min:     70
Max:     90
Average: 80.00
```

## Common mistakes

- Using index `length` (off-by-one) instead of `length - 1`
- Forgetting to pass length into helper functions
- Assuming `sizeof` on a function parameter gives the full array size
- Leaving unused elements uninitialized and then reading them
- Writing past the fixed maximum capacity

## Practice exercises

1. Write `reverse_copy(src, dest, length)` that fills `dest` with `src` reversed.
2. Write `count_above(values, length, threshold)` returning how many values are strictly greater than `threshold`.
3. Write `find_value(values, length, target)` returning the first matching index, or `-1` if absent.

Attempt these in your own file before opening `solution.c`.

## What you should understand before continuing

- [ ] Indexes start at 0; valid range is `0 .. length-1`
- [ ] Array parameters decay to pointers; length must be passed separately
- [ ] Capacity and count are different ideas
- [ ] Out-of-bounds access is undefined behavior, not a guaranteed crash
- [ ] Aggregate helpers should take `(const int arr[], int length)` when they only read

Next: [Strings and Character Handling](../Strings%20and%20Character%20Handling/)

## Note on `solution.c`

`solution.c` is the reference solution for the practice exercises above. Study it after you try the exercises yourself.

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```
