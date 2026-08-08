# Lesson 13: Searching and Sorting

**Difficulty:** Intermediate  
**Prerequisites:** [Header Files and Multiple Source Files](../Header%20Files%20and%20Multiple%20Source%20Files/) (arrays and loops are essential)

## Learning objectives

- Implement linear search and explain when it is appropriate
- Implement binary search and state its **sorted** precondition
- Implement bubble sort (teaching) and insertion sort (more practical for small data)
- Sort ascending and descending
- Relate each algorithm to a beginner-friendly Big-O intuition

## Concepts

| Algorithm | Needs sorted input? | Beginner Big-O intuition |
|-----------|---------------------|---------------------------|
| Linear search | No | O(n) — may look at every element |
| Binary search | Yes (ascending here) | O(log n) — halve the range each step |
| Bubble sort | No (produces sorted order) | O(n²) — nested adjacent swaps |
| Insertion sort | No (produces sorted order) | O(n²) worst; good on nearly-sorted data |

**Binary search rule:** If the array is not sorted the way the algorithm expects, results are wrong — not merely “slow”.

## Syntax highlights

```c
/* Linear: walk indices 0 .. n-1 */
for (i = 0; i < n; i++) {
    if (a[i] == target) return (int)i;
}

/* Binary: maintain lo/hi while lo <= hi; compare a[mid] */
/* Bubble: for each pass, swap adjacent out-of-order pairs */
/* Insertion: take a[i], shift larger (or smaller) neighbors right, place key */
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic search_sort.c -o search_sort.exe
search_sort.exe
```

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```

## Example I/O

```text
=== Lesson 13: Searching and Sorting ===

Original: 42 7 19 3 42 11

--- Linear search for 19 ---
  linear: check index 0 (value 42)
  linear: check index 1 (value 7)
  linear: check index 2 (value 19)
Found 19 at index 2

--- Bubble sort ascending (teaching) ---
  bubble pass 1:  7 19 3 42 11 42
  ...
Bubble result: 3 7 11 19 42 42

--- Binary search for 19 (requires sorted ascending) ---
  binary: lo=0 hi=5 mid=2 (value 11)
  ...
Found 19 at index 3
```

## Common mistakes

- Running binary search on an unsorted array
- Off-by-one errors in `hi` / `mid` (especially unsigned `size_t` when `mid == 0`)
- Forgetting that bubble/insertion modify the array in place
- Confusing “stable sort” theory with this lesson’s teaching demos
- Claiming O(1) for search without a hash table (not covered here)

## Practice exercises

1. **Count occurrences:** Linear-scan an array and count how many times a target appears.
2. **Sort then search:** Copy an array, insertion-sort ascending, then binary-search a value.
3. **Sorted predicate:** Write `is_sorted_asc` that returns whether each element is ≤ the next.

## What you should understand before continuing

- [ ] I can explain linear vs binary search trade-offs
- [ ] I never binary-search unsorted data
- [ ] I can trace one bubble pass and one insertion step on paper
- [ ] I can sort both ascending and descending
- [ ] I can state beginner Big-O for each demo algorithm

Next: [Intermediate Console Project](../Intermediate%20Console%20Project/)

## Note on `solution.c`

Complete the exercises in your own file first. `solution.c` implements all three with interactive targets (and sensible defaults if input fails).
