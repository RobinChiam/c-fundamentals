# Lesson 9: Structures and Enumerations

**Difficulty:** Intermediate  
**Prerequisites:** [Pointers](../Pointers/)

## Learning objectives

- Define and initialize `struct` types
- Access members with `.` and `->`
- Keep arrays of structs as fixed tables of records
- Pass structs by value vs by pointer and know the difference
- Use `enum` for small closed sets of named states
- Build a tiny add / list / find workflow

## Concepts (plain language)

A **structure** bundles related fields into one type (`id`, `name`, `grade`, `status`). An **enumeration** gives readable names to integer codes (`STATUS_ACTIVE`).

`student.grade` accesses a member when you have a struct object. `student_ptr->grade` is the same idea when you have a pointer — it means `(*student_ptr).grade`.

Passing a struct **by value** copies every member. Changes inside the function stay local. Passing a **pointer** lets the function update the caller's record and avoids large copies.

## Important syntax

```c
enum StudentStatus { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_GRADUATED };

struct Student {
    int id;
    char name[40];
    double grade;
    enum StudentStatus status;
};

struct Student s = { .id = 1, .name = "Ada", .grade = 90.0,
                     .status = STATUS_ACTIVE };
s.grade = 91.0;
print_student(&s);   /* pointer parameter uses -> inside */
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic structures.c -o structures.exe
structures.exe
```

## Example interaction

```text
=== Lesson 9: Structures and Enumerations ===
Pass-by-value vs pointer demo on Ada:
...
--- Menu ---
1) Add student
2) List students
3) Find by id
4) Quit
Choice: 2
[0] id=1001 name="Ada" grade=... status=ACTIVE
```

## Common mistakes

- Using `.` on a pointer (or `->` on a non-pointer)
- Expecting pass-by-value to mutate the caller's struct
- Forgetting capacity checks when appending to a fixed array of structs
- Comparing structs with `==` (not allowed for structs in C — compare fields)
- Leaving `char` name buffers uninitialized

## Practice exercises

1. Define a `Product` struct with `sku`, `name`, `price`, and an enum `category`.
2. Implement add / list / find-by-sku on a fixed inventory array.
3. Write `average_price_for_category(...)` that averages prices for one category.

Try them before opening `solution.c`.

## What you should understand before continuing

- [ ] Structs group fields; enums name integer states
- [ ] `.` vs `->` depends on object vs pointer
- [ ] Pass-by-value copies; pointers share the original
- [ ] Fixed arrays of structs need an explicit count + capacity
- [ ] Record assignment (`a = b`) copies all members

## Note on `solution.c`

`solution.c` is the reference solution for the practice exercises above (product inventory variant).

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```
