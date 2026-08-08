/*
 * Lesson 0 — Basic IO (starter)
 *
 * First compile-and-run example: greet the user with safe line input.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic main.c -o main.exe
 */

#include <stdio.h>
#include <string.h>

#define NAME_CAPACITY 64

static void pause_at_exit(void)
{
    int ch = 0;

    printf("Press Enter to exit...");
    do {
        ch = getchar();
    } while (ch != '\n' && ch != EOF);
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

int main(void)
{
    char name[NAME_CAPACITY];

    printf("What is your name?\nName: ");
    fflush(stdout);
    if (fgets(name, (int)sizeof name, stdin) == NULL) {
        printf("No input available.\n");
        pause_at_exit();
        return 1;
    }
    strip_trailing_newline(name);

    if (name[0] == '\0') {
        printf("Name cannot be empty.\n");
        pause_at_exit();
        return 1;
    }

    printf("Welcome, %s!\n", name);
    pause_at_exit();
    return 0;
}
