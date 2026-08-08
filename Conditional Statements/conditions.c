/*
 * Lesson 3 — Conditional Statements (primary demo)
 *
 * Grade classifier with if/else if/else, plus a small calculator menu using
 * switch. Also shows nested decisions and combined conditions.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic conditions.c -o conditions.exe
 */

#include <stdio.h>
#include <stdlib.h> /* strtol */
#include <errno.h>
#include <limits.h>

#define LINE_CAPACITY 64

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Separate from core lesson logic. Portable Enter wait via getchar.
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

/* Read one line and parse an int safely. Returns 1 on success, 0 on failure. */
static int read_int_prompt(const char *prompt, int *out_value)
{
    char line[LINE_CAPACITY];
    char *end = NULL;
    long parsed = 0L;

    printf("%s", prompt);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        return 0;
    }

    errno = 0;
    parsed = strtol(line, &end, 10);
    if (end == line || errno == ERANGE) {
        return 0;
    }
    /* Allow trailing spaces/newline only. */
    while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
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

int main(void)
{
    int score = 0;
    int menu_choice = 0;
    int left = 0;
    int right = 0;
    char letter_grade = '?';

    printf("=== Grade classifier ===\n");
    if (!read_int_prompt("Enter score (0-100): ", &score)) {
        printf("Invalid score input.\n");
        pause_at_exit();
        return 1;
    }

    /* Cascading if/else if: first true branch wins; rest are skipped. */
    if (score < 0 || score > 100) {
        printf("Score out of range.\n");
    } else if (score >= 90) {
        letter_grade = 'A';
    } else if (score >= 80) {
        letter_grade = 'B';
    } else if (score >= 70) {
        letter_grade = 'C';
    } else if (score >= 60) {
        letter_grade = 'D';
    } else {
        letter_grade = 'F';
    }

    if (score >= 0 && score <= 100) {
        printf("Letter grade: %c\n", letter_grade);
        /* Nested condition: extra note only for passing grades. */
        if (letter_grade != 'F') {
            if (score >= 95) {
                printf("Excellent work!\n");
            } else {
                printf("Passing — keep practicing.\n");
            }
        } else {
            printf("Not passing — review and try again.\n");
        }
    }

    printf("\n=== Simple calculator menu (switch) ===\n");
    printf("1) Add\n2) Subtract\n3) Multiply\n4) Divide\n");
    if (!read_int_prompt("Choose 1-4: ", &menu_choice)) {
        printf("Invalid menu choice.\n");
        pause_at_exit();
        return 1;
    }
    if (!read_int_prompt("Left operand: ", &left) ||
        !read_int_prompt("Right operand: ", &right)) {
        printf("Invalid operand.\n");
        pause_at_exit();
        return 1;
    }

    /* switch compares an integer expression to case labels.
     * break prevents fall-through into the next case. */
    switch (menu_choice) {
    case 1:
        printf("%d + %d = %d\n", left, right, left + right);
        break;
    case 2:
        printf("%d - %d = %d\n", left, right, left - right);
        break;
    case 3:
        printf("%d * %d = %d\n", left, right, left * right);
        break;
    case 4:
        if (right == 0) {
            printf("Cannot divide by zero.\n");
        } else {
            printf("%d / %d = %.2f\n", left, right, (double)left / (double)right);
        }
        break;
    default:
        printf("Unknown menu option.\n");
        break;
    }

    pause_at_exit();
    return 0;
}
