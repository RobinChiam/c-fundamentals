# Lesson 8: Pointers

**Difficulty:** Intermediate  
**Prerequisites:** [Strings and Character Handling](../Strings%20and%20Character%20Handling/)

## Learning objectives

- Read addresses with `&` and values with `*`
- Pass pointers so functions can modify caller variables
- Return multiple results through out-parameters
- Relate array indexing to pointer arithmetic
- Check for `NULL` before dereferencing
- Distinguish `const int *` from `int * const`

## Concepts (plain language)

A **pointer** holds the address of another object. `&x` is the address of `x`. If `p` points at `x`, then `*p` is another name for `x`.

Function arguments are passed by value. `swap(a, b)` cannot change the caller's `a` and `b` unless you pass `&a` and `&b` and write through those pointers.

Arrays decay to pointers to their first element. `values[i]` means `*(values + i)`.

`NULL` means “this pointer does not point at a valid object.” Dereferencing `NULL` is undefined behavior — always check when a pointer might be empty.

## Important syntax

```c
int x = 5;
int *p = &x;     /* p points at x */
*p = 9;          /* modifies x */

void swap_ints(int *a, int *b);
swap_ints(&left, &right);

const int *r = &x;  /* cannot assign through r */
int *const c = &x;  /* cannot reseat c */
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic pointers.c -o pointers.exe
pointers.exe
```

## Example interaction

```text
=== Lesson 8: Pointers ===
Enter left integer: 3
Enter right integer: 9
Before swap: left=3 right=9
After swap:  left=9 right=3
...
min=... max=...
Pointer walk: ...
```

## Common mistakes

- Declaring `int *p` and using `*p` before assigning a valid address
- Confusing `int *p` with `int p` (pointer vs int)
- Forgetting `&` when calling a function that needs an out-parameter
- Dereferencing `NULL`
- Mixing up `const int *` (read-only data) with `int * const` (fixed address)

## Practice exercises

1. Write `absolute_via_pointer(const int *value, int *out)` that stores `|value|` in `*out`.
2. Write `reverse_with_pointers(int *values, int length)` using two moving pointers.
3. Write `sum_with_pointer(const int *values, int length, long *out_sum)`.

Try them before opening `solution.c`.

## What you should understand before continuing

- [ ] `&` yields an address; `*` follows an address
- [ ] Pointer parameters enable in-place modification and out-parameters
- [ ] Array names decay to pointers in most expressions
- [ ] Never dereference an unchecked possibly-`NULL` pointer
- [ ] `const` placement changes what is locked (pointee vs pointer)

## Note on `solution.c`

`solution.c` is the reference solution for the practice exercises above.

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```
