/*
 * Lesson 0 — Drawing Shapes (starter)
 *
 * Print a hash-mark pyramid using nested loops and validated input.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic shapes.c -o shapes.exe
 */

#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define LINE_CAPACITY 64
#define MAX_HEIGHT 40

static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

static int read_int(const char *prompt, int *out_value)
{
    char line[LINE_CAPACITY];
    char *end = NULL;
    long parsed = 0L;

    if (out_value == NULL) {
        return 0;
    }

    for (;;) {
        printf("%s", prompt);
        fflush(stdout);
        if (fgets(line, (int)sizeof line, stdin) == NULL) {
            return 0;
        }
        if (strchr(line, '\n') == NULL) {
            int ch = 0;
            while ((ch = getchar()) != '\n' && ch != EOF) {
            }
            printf("Input too long; try again.\n");
            continue;
        }

        errno = 0;
        parsed = strtol(line, &end, 10);
        if (end == line) {
            printf("Not an integer; try again.\n");
            continue;
        }
        if (errno == ERANGE) {
            printf("Number out of range; try again.\n");
            continue;
        }
        while (*end == ' ' || *end == '\t' || *end == '\n' || *end == '\r') {
            end++;
        }
        if (*end != '\0') {
            printf("Extra characters after the number; try again.\n");
            continue;
        }
        if (parsed < (long)INT_MIN || parsed > (long)INT_MAX) {
            printf("Number out of range; try again.\n");
            continue;
        }

        *out_value = (int)parsed;
        return 1;
    }
}

int main(void)
{
    int height = 0;
    int row = 0;

    if (!read_int("Please input the height of your pyramid: ", &height)) {
        pause_at_exit();
        return 1;
    }
    if (height < 1 || height > MAX_HEIGHT) {
        printf("Height must be between 1 and %d.\n", MAX_HEIGHT);
        pause_at_exit();
        return 1;
    }

    for (row = 1; row <= height; row++) {
        int col = 0;
        for (col = 0; col < row; col++) {
            printf("#");
        }
        printf("\n");
    }

    pause_at_exit();
    return 0;
}
