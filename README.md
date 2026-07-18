# C Fundamentals

A hands-on curriculum that takes you from minimal C knowledge to writing small and medium-sized console programs. Lessons are self-contained Windows-oriented console examples you can type, compile, run, modify, and debug.

This repository began as a short recap of C programming fundamentals. It now follows a deliberate beginner-to-intermediate learning path while keeping the original approachable style: Title Case lesson folders, simple console programs, and plenty of explanatory comments.

## Intended audience

- Absolute beginners who have never written C (or much programming) before
- Learners refreshing C before systems, embedded, or coursework
- Anyone who prefers learning by compiling and changing small programs

## Required tools

- A text editor (Visual Studio Code, Notepad++, Cursor, etc.)
- **GCC via MinGW-w64** (or MSYS2) on Windows
- A terminal / Command Prompt / PowerShell

### GCC/MinGW setup assumptions

This curriculum targets **standard C17** with MinGW-style GCC on Windows:

```text
gcc --version
```

If that command works, you are ready. On Linux or macOS you can use the system `gcc` the same way; only the optional pause-at-exit behavior is Windows-oriented.

## General compile and run examples

From a lesson folder:

```text
gcc -std=c17 -Wall -Wextra -Wpedantic program.c -o program.exe
program.exe
```

For lessons with multiple source files:

```text
gcc -std=c17 -Wall -Wextra -Wpedantic main.c other.c -o program.exe
program.exe
```

**Do not commit generated `.exe` files** (or `.o` object files). The `.gitignore` file already ignores them.

## Recommended study workflow

1. Read the lesson `README.md` and note the objectives.
2. Type or carefully study the primary example.
3. Compile with the strict warning flags above and fix every warning.
4. Run the program with normal, invalid, and boundary inputs.
5. Attempt the practice exercises **before** opening `solution.c`.
6. Compare your approach with `solution.c`, then modify the example to explore “what if…?” questions.
7. Only move on when the checklist at the bottom of the lesson README makes sense.

## Ordered curriculum

| Order | Lesson | Difficulty | What you will learn |
|------:|--------|------------|---------------------|
| 0 | [Basic IO](Basic%20IO/) | Beginner (starter) | Simple console input/output (existing starter) |
| 0 | [Drawing Shapes](Drawing%20Shapes/) | Beginner (starter) | Nested loops drawing a pyramid (existing starter) |
| 1 | [Variables and Data Types](Variables%20and%20Data%20Types/) | Beginner | Declarations, types, format specifiers, `sizeof` |
| 2 | [Operators and Expressions](Operators%20and%20Expressions/) | Beginner | Arithmetic, comparisons, logic, precedence |
| 3 | [Conditional Statements](Conditional%20Statements/) | Beginner | `if` / `else`, `switch`, menus |
| 4 | [Loops and Input Validation](Loops%20and%20Input%20Validation/) | Beginner | `while` / `for` / `do while`, safe numeric input |
| 5 | [Functions and Scope](Functions%20and%20Scope/) | Beginner–Intermediate | Parameters, return values, scope, recursion intro |
| 6 | [Arrays](Arrays/) | Intermediate | Indexing, traversal, aggregates, bounds safety |
| 7 | [Strings and Character Handling](Strings%20and%20Character%20Handling/) | Intermediate | Null-terminated strings, `fgets`, `<string.h>`, `<ctype.h>` |
| 8 | [Pointers](Pointers/) | Intermediate | Addresses, dereference, out-parameters, arrays vs pointers |
| 9 | [Structures and Enumerations](Structures%20and%20Enumerations/) | Intermediate | `struct`, `enum`, records, `->` |
| 10 | [File Input and Output](File%20Input%20and%20Output/) | Intermediate | Text files, append mode, error handling |
| 11 | [Dynamic Memory Allocation](Dynamic%20Memory%20Allocation/) | Intermediate | `malloc` / `calloc` / `realloc` / `free` |
| 12 | [Header Files and Multiple Source Files](Header%20Files%20and%20Multiple%20Source%20Files/) | Intermediate | Modular builds, headers, include guards |
| 13 | [Searching and Sorting](Searching%20and%20Sorting/) | Intermediate | Linear/binary search, bubble & insertion sort |
| 14 | [Intermediate Console Project](Intermediate%20Console%20Project/) | Intermediate | Menu-driven task tracker combining prior topics |

## Notes about the starter lessons

`Basic IO` and `Drawing Shapes` are the original starter programs. Newer lessons intentionally use safer input patterns (`fgets` plus parsing) rather than copying older `scanf` habits. Keep the starters for historical/context practice, but treat lessons 1–14 as the recommended path for good C habits.

## Pause-at-exit convention

Many examples wait for Enter before exiting so a console window opened on Windows does not close immediately. That pause is a **platform convenience**, not a C language concept, and it is kept separate from each lesson’s core logic.
