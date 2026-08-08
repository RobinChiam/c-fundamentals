/*
 * Lesson 10 — Files (reference solution for README exercises)
 *
 * Exercises covered:
 *  1) Rewrite the whole file from an in-memory array (save)
 *  2) Count lines / records in the file
 *  3) Find a record by id without loading everything twice carelessly
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define DATA_FILE "sample_data.txt"
#define LINE_SIZE 128
#define NAME_SIZE 40
#define MAX_RECORDS 64

struct Record {
    int id;
    char name[NAME_SIZE];
    int quantity;
};

static void pause_at_exit(void)
{
    /* Platform convenience for Windows consoles — not core C logic. */
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

static void strip_trailing_newline(char *text)
{
    size_t len = 0;

    if (text == NULL) {
        return;
    }
    len = strlen(text);
    if (len > 0U && text[len - 1U] == '\n') {
        text[len - 1U] = '\0';
    }
}

static int read_line(const char *prompt, char *buf, size_t buf_size)
{
    if (buf == NULL || buf_size == 0U) {
        return 0;
    }
    printf("%s", prompt);
    fflush(stdout);
    if (fgets(buf, (int)buf_size, stdin) == NULL) {
        return 0;
    }
    strip_trailing_newline(buf);
    return 1;
}

static int read_int(const char *prompt, int *out_value)
{
    char line[LINE_SIZE];
    char *end = NULL;
    long parsed = 0;

    if (out_value == NULL || !read_line(prompt, line, sizeof line)) {
        return 0;
    }
    parsed = strtol(line, &end, 10);
    if (end == line) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    if (parsed < (long)INT_MIN || parsed > (long)INT_MAX) {
        return 0;
    }
    *out_value = (int)parsed;
    return 1;
}

static int parse_record_line(const char *line, struct Record *out)
{
    char name[NAME_SIZE];
    int id = 0;
    int quantity = 0;

    if (line == NULL || out == NULL) {
        return 0;
    }
    if (sscanf(line, "%d,%39[^,],%d", &id, name, &quantity) != 3) {
        return 0;
    }
    out->id = id;
    out->quantity = quantity;
    (void)snprintf(out->name, sizeof out->name, "%s", name);
    return 1;
}

static int load_records(struct Record records[], int capacity, int *out_count)
{
    FILE *fp = NULL;
    char line[LINE_SIZE];
    int count = 0;

    if (records == NULL || out_count == NULL) {
        return 0;
    }
    *out_count = 0;

    fp = fopen(DATA_FILE, "r");
    if (fp == NULL) {
        printf("%s is missing — starting with an empty list.\n", DATA_FILE);
        return 1; /* graceful: empty dataset is OK */
    }

    while (fgets(line, (int)sizeof line, fp) != NULL) {
        struct Record item;

        strip_trailing_newline(line);
        if (line[0] == '\0') {
            continue;
        }
        if (!parse_record_line(line, &item)) {
            continue;
        }
        if (count >= capacity) {
            break;
        }
        records[count++] = item;
    }

    if (ferror(fp)) {
        perror("fgets");
        clearerr(fp);
        fclose(fp);
        return 0;
    }
    fclose(fp);
    *out_count = count;
    return 1;
}

/* Exercise 1: rewrite the entire file from memory ("w" truncates). */
static int save_records(const struct Record records[], int count)
{
    FILE *fp = NULL;
    int i = 0;

    fp = fopen(DATA_FILE, "w");
    if (fp == NULL) {
        perror("fopen (save)");
        return 0;
    }

    for (i = 0; i < count; i++) {
        if (fprintf(fp, "%d,%s,%d\n", records[i].id, records[i].name,
                    records[i].quantity) < 0) {
            perror("fprintf");
            fclose(fp);
            return 0;
        }
    }

    if (fclose(fp) != 0) {
        perror("fclose");
        return 0;
    }
    return 1;
}

/* Exercise 2: count non-empty lines in the file. */
static int count_file_lines(const char *path, int *out_lines)
{
    FILE *fp = NULL;
    char line[LINE_SIZE];
    int lines = 0;

    if (path == NULL || out_lines == NULL) {
        return 0;
    }
    *out_lines = 0;

    fp = fopen(path, "r");
    if (fp == NULL) {
        printf("Cannot count lines: ");
        perror(path);
        return 0;
    }

    while (fgets(line, (int)sizeof line, fp) != NULL) {
        strip_trailing_newline(line);
        if (line[0] != '\0') {
            lines++;
        }
    }
    if (ferror(fp)) {
        perror("fgets");
        clearerr(fp);
        fclose(fp);
        return 0;
    }
    fclose(fp);
    *out_lines = lines;
    return 1;
}

/* Exercise 3: find by id in the loaded array. */
static int find_record_index(const struct Record records[], int count, int id)
{
    int i = 0;

    for (i = 0; i < count; i++) {
        if (records[i].id == id) {
            return i;
        }
    }
    return -1;
}

int main(void)
{
    struct Record records[MAX_RECORDS];
    int count = 0;
    int choice = 0;
    int running = 1;
    int i = 0;
    int lines = 0;

    for (i = 0; i < MAX_RECORDS; i++) {
        records[i] = (struct Record){0, "", 0};
    }

    printf("=== Lesson 10 solution: file exercises ===\n");
    printf("File: %s\n", DATA_FILE);

    if (!load_records(records, MAX_RECORDS, &count)) {
        pause_at_exit();
        return 1;
    }
    printf("Loaded %d record(s).\n", count);

    while (running) {
        printf("1) List  2) Add+save  3) Count lines  4) Find id  5) Quit\n");
        if (!read_int("Choice: ", &choice)) {
            printf("Invalid.\n");
            continue;
        }

        switch (choice) {
        case 1:
            for (i = 0; i < count; i++) {
                printf("id=%d name=\"%s\" qty=%d\n", records[i].id,
                       records[i].name, records[i].quantity);
            }
            break;
        case 2: {
            struct Record item = {0, "", 0};

            if (count >= MAX_RECORDS) {
                printf("Memory table full.\n");
                break;
            }
            while (!read_int("id: ", &item.id) || item.id <= 0) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Positive id required.\n");
            }
            if (find_record_index(records, count, item.id) >= 0) {
                printf("Duplicate id.\n");
                break;
            }
            while (!read_line("name: ", item.name, sizeof item.name) ||
                   item.name[0] == '\0' || strchr(item.name, ',') != NULL) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Non-empty name without commas.\n");
            }
            while (!read_int("quantity: ", &item.quantity) ||
                   item.quantity < 0) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Non-negative quantity.\n");
            }
            records[count++] = item;
            if (save_records(records, count)) {
                printf("Saved %d record(s) to %s\n", count, DATA_FILE);
            }
            break;
        }
        case 3:
            if (count_file_lines(DATA_FILE, &lines)) {
                printf("%s has %d non-empty line(s).\n", DATA_FILE, lines);
            }
            break;
        case 4: {
            int id = 0;
            int index = -1;

            while (!read_int("id: ", &id)) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter an integer id.\n");
            }
            index = find_record_index(records, count, id);
            if (index < 0) {
                printf("Not found in memory table (load/save first).\n");
            } else {
                printf("Found: id=%d name=\"%s\" qty=%d\n", records[index].id,
                       records[index].name, records[index].quantity);
            }
            break;
        }
        case 5:
            running = 0;
            break;
        default:
            printf("Choose 1-5.\n");
            break;
        }
    }

    pause_at_exit();
    return 0;
}
