# Lesson 10: File Input and Output

**Difficulty:** Intermediate  
**Prerequisites:** [Structures and Enumerations](../Structures%20and%20Enumerations/)

## Learning objectives

- Open and close text files with `fopen` / `fclose`
- Write, read, and append line-based records
- Always check whether `fopen` succeeded
- Detect EOF vs read errors (`ferror`, `clearerr`)
- Parse simple CSV-like lines into structs
- Handle a missing file without crashing
- Use relative filenames such as `sample_data.txt`

## Concepts (plain language)

A **file** is durable storage outside your program’s memory. `fopen(path, mode)` returns a `FILE *` or `NULL` on failure. Modes you need here:

| Mode | Meaning |
|------|---------|
| `"r"` | read existing file |
| `"w"` | create/truncate for writing |
| `"a"` | append (create if missing) |

Always `fclose` every successfully opened stream, including error paths after a failed write.

This lesson uses a relative name: `sample_data.txt`. That file is created in the **current working directory** (usually the lesson folder if you run the program from there).

Record format (one per line):

```text
id,name,quantity
101,Notebook,3
```

Names must not contain commas in this simplified format.

## Important syntax

```c
FILE *fp = fopen("sample_data.txt", "r");
if (fp == NULL) {
    perror("fopen");
    /* handle missing/unreadable file */
}

while (fgets(line, (int)sizeof line, fp) != NULL) {
    /* parse line */
}
if (ferror(fp)) {
    perror("fgets");
    clearerr(fp);
}
fclose(fp);
```

## Build and run

```text
gcc -std=c17 -Wall -Wextra -Wpedantic files.c -o files.exe
files.exe
```

Run from the `File Input and Output` directory so `sample_data.txt` appears beside the sources.

## Example interaction

```text
=== Lesson 10: File Input and Output ===
Working file: sample_data.txt (relative path in the current directory)
Created starter file sample_data.txt
--- Menu ---
1) Load and list records from sample_data.txt
2) Append a new record
3) Quit
Choice: 1
Loaded 2 record(s).
[0] id=101 name="Notebook" qty=3
[1] id=102 name="Pencil" qty=12
```

## Common mistakes

- Using the `FILE *` after a failed `fopen` (`NULL`)
- Forgetting `fclose` on error paths (resource leak)
- Assuming `fgets` failure always means EOF (check `ferror`)
- Writing CSV fields that contain the delimiter without an escaping scheme
- Running the program from another directory and wondering where the file went

## Practice exercises

1. Write `save_records` that rewrites the entire file from an in-memory array (`"w"`).
2. Write `count_file_lines` that counts non-empty lines in `sample_data.txt`.
3. Add find-by-id against the loaded table and keep the file in sync after edits.

Try them before opening `solution.c`.

## What you should understand before continuing

- [ ] `fopen` can fail; always check for `NULL`
- [ ] `"r"` / `"w"` / `"a"` behave differently (especially truncation vs append)
- [ ] Every successful open needs a matching `fclose`
- [ ] Text record formats need careful parsing and validation
- [ ] Missing files should be reported, not crash the process

## Note on `solution.c`

`solution.c` is the reference solution for the practice exercises above. It also treats a missing file as an empty dataset when loading.

```text
gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
solution.exe
```
