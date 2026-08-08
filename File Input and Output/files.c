/*
 * Lesson 10 — File Input and Output
 *
 * Goal: write, read, and append simple line-based records in sample_data.txt.
 * Handle a missing file gracefully, always check fopen, and close on every path.
 *
 * WHY files: console I/O disappears when the program exits. Files keep records
 * between runs. Text modes are portable enough for learning; always check errors.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic files.c -o files.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

#define DATA_FILE "sample_data.txt"
#define LINE_SIZE 128
#define NAME_SIZE 40
#define MAX_RECORDS 32

struct Record {
    int id;
    char name[NAME_SIZE];
    int quantity;
};

/* Windows-console convenience — not a C language concept. */
static void pause_at_exit(void)
{
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

/* Parse "id,name,quantity" — name must not contain commas for this simple format. */
static int parse_record_line(const char *line, struct Record *out)
{
    char name[NAME_SIZE];
    int id = 0;
    int quantity = 0;
    int matched = 0;

    if (line == NULL || out == NULL) {
        return 0;
    }

    /* %39[^,] reads up to 39 chars that are not commas into name. */
    matched = sscanf(line, "%d,%39[^,],%d", &id, name, &quantity);
    if (matched != 3) {
        return 0;
    }

    out->id = id;
    out->quantity = quantity;
    (void)snprintf(out->name, sizeof out->name, "%s", name);
    return 1;
}

/* Create a starter file if missing so first-time learners have something to read. */
static int ensure_sample_file(void)
{
    FILE *fp = NULL;

    fp = fopen(DATA_FILE, "r");
    if (fp != NULL) {
        fclose(fp);
        return 1; /* already exists */
    }

    /* Missing file is normal on first run — create a seed file. */
    fp = fopen(DATA_FILE, "w");
    if (fp == NULL) {
        perror("fopen (create " DATA_FILE ")");
        return 0;
    }

    fprintf(fp, "101,Notebook,3\n");
    fprintf(fp, "102,Pencil,12\n");
    if (fclose(fp) != 0) {
        perror("fclose");
        return 0;
    }
    printf("Created starter file %s\n", DATA_FILE);
    return 1;
}

static int load_records(struct Record records[], int capacity, int *out_count)
{
    FILE *fp = NULL;
    char line[LINE_SIZE];
    int count = 0;

    if (records == NULL || out_count == NULL || capacity <= 0) {
        return 0;
    }
    *out_count = 0;

    fp = fopen(DATA_FILE, "r");
    if (fp == NULL) {
        /* Graceful path: tell the user, do not crash. */
        printf("Could not open %s for reading ", DATA_FILE);
        perror("");
        return 0;
    }

    while (fgets(line, (int)sizeof line, fp) != NULL) {
        struct Record item;

        strip_trailing_newline(line);
        if (line[0] == '\0') {
            continue;
        }
        if (!parse_record_line(line, &item)) {
            printf("Skipping bad line: \"%s\"\n", line);
            continue;
        }
        if (count >= capacity) {
            printf("Capacity reached (%d); stopping load.\n", capacity);
            break;
        }
        records[count] = item;
        count++;
    }

    /* Distinguish EOF from a hard read error. */
    if (ferror(fp)) {
        perror("fgets");
        clearerr(fp);
        fclose(fp);
        return 0;
    }

    if (fclose(fp) != 0) {
        perror("fclose");
        return 0;
    }

    *out_count = count;
    return 1;
}

static int append_record(const struct Record *item)
{
    FILE *fp = NULL;

    if (item == NULL) {
        return 0;
    }

    /* "a" creates the file if missing, then appends. */
    fp = fopen(DATA_FILE, "a");
    if (fp == NULL) {
        perror("fopen (append " DATA_FILE ")");
        return 0;
    }

    if (fprintf(fp, "%d,%s,%d\n", item->id, item->name, item->quantity) < 0) {
        perror("fprintf");
        fclose(fp);
        return 0;
    }

    if (fclose(fp) != 0) {
        perror("fclose");
        return 0;
    }
    return 1;
}

static void print_records(const struct Record records[], int count)
{
    int i = 0;

    if (count <= 0) {
        printf("No records loaded.\n");
        return;
    }
    for (i = 0; i < count; i++) {
        printf("[%d] id=%d name=\"%s\" qty=%d\n", i, records[i].id,
               records[i].name, records[i].quantity);
    }
}

int main(void)
{
    struct Record records[MAX_RECORDS];
    int count = 0;
    int choice = 0;
    int running = 1;
    int i = 0;

    for (i = 0; i < MAX_RECORDS; i++) {
        records[i] = (struct Record){0, "", 0};
    }

    printf("=== Lesson 10: File Input and Output ===\n");
    printf("Working file: %s (relative path in the current directory)\n",
           DATA_FILE);

    if (!ensure_sample_file()) {
        printf("Cannot continue without a data file.\n");
        pause_at_exit();
        return 1;
    }

    while (running) {
        printf("--- Menu ---\n");
        printf("1) Load and list records from %s\n", DATA_FILE);
        printf("2) Append a new record\n");
        printf("3) Quit\n");

        if (!read_int("Choice: ", &choice)) {
            printf("Invalid choice.\n");
            continue;
        }

        switch (choice) {
        case 1:
            if (load_records(records, MAX_RECORDS, &count)) {
                printf("Loaded %d record(s).\n", count);
                print_records(records, count);
            }
            break;
        case 2: {
            struct Record item = {0, "", 0};

            while (!read_int("id: ", &item.id) || item.id <= 0) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter a positive id.\n");
            }
            while (!read_line("name (no commas): ", item.name,
                              sizeof item.name) ||
                   item.name[0] == '\0' ||
                   strchr(item.name, ',') != NULL) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter a non-empty name without commas.\n");
            }
            while (!read_int("quantity: ", &item.quantity) ||
                   item.quantity < 0) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter a non-negative quantity.\n");
            }

            if (append_record(&item)) {
                printf("Appended to %s\n", DATA_FILE);
            }
            break;
        }
        case 3:
            running = 0;
            break;
        default:
            printf("Choose 1-3.\n");
            break;
        }
    }

    pause_at_exit();
    return 0;
}
