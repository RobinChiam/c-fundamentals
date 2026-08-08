/*
 * Lesson 0 — Basic IO (reference solution)
 *
 * Exercise: greet the user and read a validated age with fgets + strtol.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define NAME_CAPACITY 64
#define LINE_CAPACITY 64

static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
}

static int read_line(const char *prompt, char *buffer, size_t size)
{
    if (buffer == NULL || size == 0U) {
        return 0;
    }

    printf("%s", prompt);
    fflush(stdout);
    if (fgets(buffer, (int)size, stdin) == NULL) {
        return 0;
    }
    if (strchr(buffer, '\n') == NULL) {
        int ch = 0;
        while ((ch = getchar()) != '\n' && ch != EOF) {
        }
        return 0;
    }
    buffer[strcspn(buffer, "\n")] = '\0';
    return 1;
}

static int read_age(int *out_age)
{
    char line[LINE_CAPACITY];
    char *end = NULL;
    long parsed = 0L;

    if (out_age == NULL) {
        return 0;
    }

    for (;;) {
        if (!read_line("Age: ", line, sizeof line)) {
            return 0;
        }
        if (line[0] == '\0') {
            printf("Please enter a number.\n");
            continue;
        }

        errno = 0;
        parsed = strtol(line, &end, 10);
        if (end == line) {
            printf("Not an integer; try again.\n");
            continue;
        }
        if (errno == ERANGE || parsed < 0L || parsed > 120L) {
            printf("Please enter an age from 0 to 120.\n");
            continue;
        }
        while (*end == ' ' || *end == '\t') {
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

        *out_age = (int)parsed;
        return 1;
    }
}

int main(void)
{
    char name[NAME_CAPACITY];
    int age = 0;

    if (!read_line("What is your name?\nName: ", name, sizeof name) ||
        name[0] == '\0') {
        printf("Invalid name.\n");
        pause_at_exit();
        return 1;
    }

    if (!read_age(&age)) {
        printf("Could not read age.\n");
        pause_at_exit();
        return 1;
    }

    printf("Hello, %s! You are %d years old.\n", name, age);
    pause_at_exit();
    return 0;
}
