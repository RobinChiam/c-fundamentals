/*
 * Lesson 3 — Conditional Statements (reference solution)
 *
 * Exercises:
 *   1) Leap year check
 *   2) Rock-paper-scissors with if
 *   3) Expand the calculator menu (power / modulo)
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

#define LINE_CAPACITY 64

/*
 * pause_at_exit — Windows-console convenience / platform-specific helper.
 * Separate from core lesson logic.
 */
static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

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
    while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }

    *out_value = (int)parsed;
    return 1;
}

/* Leap year: divisible by 400, or by 4 but not by 100. */
static int is_leap_year(int year)
{
    if (year % 400 == 0) {
        return 1;
    }
    if (year % 100 == 0) {
        return 0;
    }
    if (year % 4 == 0) {
        return 1;
    }
    return 0;
}

int main(void)
{
    int year = 0;
    int player = 0;
    int computer = 2; /* hardcoded: 1=rock, 2=paper, 3=scissors */
    int menu_choice = 0;
    int left = 0;
    int right = 0;
    int power = 1;
    int i = 0;

    /* --- Exercise 1: leap year --- */
    printf("=== Leap year ===\n");
    if (!read_int_prompt("Enter a year: ", &year)) {
        printf("Invalid year.\n");
        pause_at_exit();
        return 1;
    }
    if (is_leap_year(year)) {
        printf("%d is a leap year.\n", year);
    } else {
        printf("%d is not a leap year.\n", year);
    }

    /* --- Exercise 2: rock-paper-scissors --- */
    printf("\n=== Rock-Paper-Scissors ===\n");
    printf("1=Rock  2=Paper  3=Scissors\n");
    if (!read_int_prompt("Your choice: ", &player)) {
        printf("Invalid choice.\n");
        pause_at_exit();
        return 1;
    }

    printf("Computer chose %d.\n", computer);
    if (player < 1 || player > 3) {
        printf("Choice must be 1, 2, or 3.\n");
    } else if (player == computer) {
        printf("Tie!\n");
    } else if ((player == 1 && computer == 3) ||
               (player == 2 && computer == 1) ||
               (player == 3 && computer == 2)) {
        printf("You win!\n");
    } else {
        printf("Computer wins!\n");
    }

    /* --- Exercise 3: expanded menu --- */
    printf("\n=== Expanded calculator menu ===\n");
    printf("1) Add  2) Subtract  3) Multiply  4) Divide  5) Modulo  6) Power\n");
    if (!read_int_prompt("Choose: ", &menu_choice) ||
        !read_int_prompt("Left: ", &left) ||
        !read_int_prompt("Right: ", &right)) {
        printf("Invalid input.\n");
        pause_at_exit();
        return 1;
    }

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
    case 5:
        if (right == 0) {
            printf("Cannot take modulo by zero.\n");
        } else {
            printf("%d %% %d = %d\n", left, right, left % right);
        }
        break;
    case 6:
        if (right < 0) {
            printf("This demo only supports non-negative exponents.\n");
        } else {
            power = 1;
            for (i = 0; i < right; i++) {
                power *= left;
            }
            printf("%d ^ %d = %d\n", left, right, power);
        }
        break;
    default:
        printf("Unknown option.\n");
        break;
    }

    pause_at_exit();
    return 0;
}
