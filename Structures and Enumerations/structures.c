/*
 * Lesson 9 — Structures and Enumerations
 *
 * Goal: manage a fixed table of Student records with an enum status:
 * add, list, and find by id. Show pass-by-value vs pointer, and -> .
 *
 * WHY structs: group related fields (id, name, grade, status) into one type
 * instead of parallel arrays that are easy to desynchronize.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic structures.c -o structures.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_STUDENTS 8
#define NAME_SIZE 40
#define LINE_SIZE 128

/* Named integer constants for a closed set of states. */
enum StudentStatus {
    STATUS_ACTIVE = 0,
    STATUS_INACTIVE = 1,
    STATUS_GRADUATED = 2
};

struct Student {
    int id;
    char name[NAME_SIZE];
    double grade;
    enum StudentStatus status;
};

/* Windows-console convenience — not core lesson logic. */
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

    if (out_value == NULL) {
        return 0;
    }
    if (!read_line(prompt, line, sizeof line)) {
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
    *out_value = (int)parsed;
    return 1;
}

static int read_double(const char *prompt, double *out_value)
{
    char line[LINE_SIZE];
    char *end = NULL;
    double parsed = 0.0;

    if (out_value == NULL) {
        return 0;
    }
    if (!read_line(prompt, line, sizeof line)) {
        return 0;
    }
    parsed = strtod(line, &end);
    if (end == line) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    *out_value = parsed;
    return 1;
}

static const char *status_to_string(enum StudentStatus status)
{
    switch (status) {
    case STATUS_ACTIVE:
        return "ACTIVE";
    case STATUS_INACTIVE:
        return "INACTIVE";
    case STATUS_GRADUATED:
        return "GRADUATED";
    default:
        return "UNKNOWN";
    }
}

/* Pass by pointer when you need to modify the record or avoid copying. */
static void print_student(const struct Student *student)
{
    if (student == NULL) {
        return;
    }
    /* -> means (*student).field — sugar for pointer-to-struct access. */
    printf("id=%d name=\"%s\" grade=%.2f status=%s\n",
           student->id, student->name, student->grade,
           status_to_string(student->status));
}

/* Pass by value copies the whole struct; changes here do NOT affect caller. */
static void bump_grade_by_value(struct Student student)
{
    student.grade += 1.0;
    printf("(by value demo) local copy grade is now %.2f — caller unchanged\n",
           student.grade);
}

static void bump_grade_by_pointer(struct Student *student)
{
    if (student == NULL) {
        return;
    }
    student->grade += 1.0;
}

static int find_student_index(const struct Student students[], int count,
                              int id)
{
    int i = 0;

    for (i = 0; i < count; i++) {
        if (students[i].id == id) {
            return i;
        }
    }
    return -1;
}

static int add_student(struct Student students[], int *count, int capacity)
{
    struct Student newbie;
    int status_choice = 0;

    if (students == NULL || count == NULL || *count >= capacity) {
        printf("Roster is full (capacity %d).\n", capacity);
        return 0;
    }

    /* Designated initializer for clarity; then overwrite with user input. */
    newbie = (struct Student){
        .id = 0,
        .name = "",
        .grade = 0.0,
        .status = STATUS_ACTIVE
    };

    while (!read_int("New student id: ", &newbie.id) || newbie.id <= 0) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter a positive integer id.\n");
    }
    if (find_student_index(students, *count, newbie.id) >= 0) {
        printf("Id %d already exists.\n", newbie.id);
        return 0;
    }

    while (!read_line("Name: ", newbie.name, sizeof newbie.name) ||
           newbie.name[0] == '\0') {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Name cannot be empty.\n");
    }

    while (!read_double("Grade (0-100): ", &newbie.grade) ||
           newbie.grade < 0.0 || newbie.grade > 100.0) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter a grade from 0 to 100.\n");
    }

    printf("Status: 0=ACTIVE 1=INACTIVE 2=GRADUATED\n");
    while (!read_int("Choice: ", &status_choice) || status_choice < 0 ||
           status_choice > 2) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter 0, 1, or 2.\n");
    }
    newbie.status = (enum StudentStatus)status_choice;

    students[*count] = newbie; /* struct assignment copies all members */
    (*count)++;
    printf("Added.\n");
    return 1;
}

static void list_students(const struct Student students[], int count)
{
    int i = 0;

    if (count <= 0) {
        printf("Roster is empty.\n");
        return;
    }
    for (i = 0; i < count; i++) {
        printf("[%d] ", i);
        print_student(&students[i]);
    }
}

int main(void)
{
    struct Student roster[MAX_STUDENTS];
    int count = 0;
    int running = 1;
    int choice = 0;
    int i = 0;

    /* Clear the fixed table so unused slots are defined. */
    for (i = 0; i < MAX_STUDENTS; i++) {
        roster[i] = (struct Student){0, "", 0.0, STATUS_INACTIVE};
    }

    /* Seed one record so list/find demos work immediately. */
    roster[0] = (struct Student){
        .id = 1001,
        .name = "Ada",
        .grade = 91.5,
        .status = STATUS_ACTIVE
    };
    count = 1;

    printf("=== Lesson 9: Structures and Enumerations ===\n");
    printf("Pass-by-value vs pointer demo on Ada:\n");
    bump_grade_by_value(roster[0]);
    printf("Caller grade still %.2f\n", roster[0].grade);
    bump_grade_by_pointer(&roster[0]);
    printf("After pointer bump, grade is %.2f\n\n", roster[0].grade);

    while (running) {
        printf("--- Menu ---\n");
        printf("1) Add student\n");
        printf("2) List students\n");
        printf("3) Find by id\n");
        printf("4) Quit\n");

        if (!read_int("Choice: ", &choice)) {
            printf("Invalid choice.\n");
            continue;
        }

        switch (choice) {
        case 1:
            (void)add_student(roster, &count, MAX_STUDENTS);
            break;
        case 2:
            list_students(roster, count);
            break;
        case 3: {
            int id = 0;
            int index = -1;

            while (!read_int("Id to find: ", &id)) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter an integer id.\n");
            }
            index = find_student_index(roster, count, id);
            if (index < 0) {
                printf("Not found.\n");
            } else {
                print_student(&roster[index]);
            }
            break;
        }
        case 4:
            running = 0;
            break;
        default:
            printf("Choose 1-4.\n");
            break;
        }
    }

    pause_at_exit();
    return 0;
}
