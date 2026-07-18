# Lesson 7: Strings and Character Handling

**Difficulty:** Intermediate  
**Prerequisites:** [Arrays](../Arrays/)

## Learning objectives

- Treat C strings as null-terminated `char` arrays
- Read lines with `fgets` and strip the trailing newline
- Use common `<string.h>` operations carefully
- Classify characters with `<ctype.h>`
- Copy and compare text with buffer-size awareness
- Never use `gets`

## Concepts (plain language)

A C string is characters followed by a `'\0'` terminator. Library functions stop at that byte. If you forget the terminator, or overwrite past the end of your array, behavior is undefined.

`fgets(buf, size, stdin)` reads at most `size - 1` characters and always writes `'\0'` when it succeeds. Prefer it over `scanf("%s")` (unbounded without a width) and never use `gets`.

`strlen` counts characters before `'\0'`. `strcmp` compares byte-by-byte (case-sensitive). `strcpy` / `strcat` are dangerous unless you have already proven the destination is large enough — prefer bounded copies you control.

`ctype.h` helpers (`isalpha`, `isdigit`, `tolower`, …) expect values representable as `unsigned char` (or `EOF`). Cast characters before calling them.

## Important syntax

```c
char line[128];
fgets(line, (int)sizeof line, stdin);   /* never gets() */
/* strip trailing '\n' if present */

size_t n = strlen(line);
int cmp = strcmp(a, b);                 /* 0 means equal */
strncpy is easy to misuse; prefer a manual bounded copy
tolower((unsigned char)ch);
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic strings.c -o strings.exe
strings.exe
```

## Example interaction

```text
=== Lesson 7: Strings and Character Handling ===
Enter a short line of text:
> Hello 42
Length (strlen): 8
Safe copy into 64-byte buffer: "Hello 42"
Enter a keyword to compare against your line:
> hello 42
strcmp: not an exact match.
strcmp_ignore_case: match (ignoring case).
Classification of "Hello 42":
  ...
```

## Common mistakes

- Using `gets` or `scanf("%s", buf)` without a field width
- Forgetting to strip `'\n'` from `fgets` input
- Calling `strcpy`/`strcat` without checking remaining capacity
- Passing a plain `char` to `ctype.h` macros without an `unsigned char` cast
- Assuming `strncpy` always null-terminates (it does not when the source is too long)

## Practice exercises

1. Write `count_vowels(text)` that counts `a/e/i/o/u` ignoring case.
2. Write `reverse_in_place(text)` that reverses a mutable C string.
3. Write `first_word(text, out, out_size)` that copies the first whitespace-delimited word into `out` safely.

Attempt these before opening `solution.c`.

## What you should understand before continuing

- [ ] Strings end with `'\0'`; length is not stored separately by the language
- [ ] `fgets` is the default safe line reader for this curriculum
- [ ] Buffer capacity must guide every copy and append
- [ ] Case-insensitive compare is something you implement (or carefully wrap)
- [ ] `ctype.h` needs the `unsigned char` cast

## Note on `solution.c`

`solution.c` is the reference solution for the practice exercises above.

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```
