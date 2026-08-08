/*
 * Lesson 7 — Strings (reference solution for README exercises)
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define LINE_SIZE 256
#define WORD_SIZE 64

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

/* Exercise 1: count vowels (a,e,i,o,u) case-insensitively. */
static int count_vowels(const char *text)
{
    int count = 0;
    size_t i = 0;

    if (text == NULL) {
        return 0;
    }
    for (i = 0; text[i] != '\0'; i++) {
        char lower = (char)tolower((unsigned char)text[i]);

        if (lower == 'a' || lower == 'e' || lower == 'i' || lower == 'o' ||
            lower == 'u') {
            count++;
        }
    }
    return count;
}

/* Exercise 2: reverse a string in place. */
static void reverse_in_place(char *text)
{
    size_t left = 0;
    size_t right = 0;
    char tmp = '\0';

    if (text == NULL || text[0] == '\0') {
        return;
    }
    right = strlen(text);
    if (right == 0U) {
        return;
    }
    right--; /* last character index */

    while (left < right) {
        tmp = text[left];
        text[left] = text[right];
        text[right] = tmp;
        left++;
        right--;
    }
}

/* Exercise 3: extract the first whitespace-delimited word into out. */
static void first_word(const char *text, char *out, size_t out_size)
{
    size_t i = 0;
    size_t j = 0;

    if (out == NULL || out_size == 0U) {
        return;
    }
    out[0] = '\0';
    if (text == NULL) {
        return;
    }

    while (text[i] != '\0' && isspace((unsigned char)text[i])) {
        i++;
    }
    while (text[i] != '\0' && !isspace((unsigned char)text[i]) &&
           j + 1U < out_size) {
        out[j] = text[i];
        j++;
        i++;
    }
    out[j] = '\0';
}

int main(void)
{
    char line[LINE_SIZE];
    char word[WORD_SIZE];
    char working[LINE_SIZE];

    line[0] = '\0';
    word[0] = '\0';
    working[0] = '\0';

    printf("=== Lesson 7 solution: string exercises ===\n");
    printf("Enter a line:\n> ");
    fflush(stdout);

    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        printf("No input.\n");
        pause_at_exit();
        return 1;
    }
    strip_trailing_newline(line);

    printf("Vowel count: %d\n", count_vowels(line));

    /* Keep original; reverse a working copy. */
    {
        size_t i = 0;

        while (i + 1U < sizeof working && line[i] != '\0') {
            working[i] = line[i];
            i++;
        }
        working[i] = '\0';
    }
    reverse_in_place(working);
    printf("Reversed: \"%s\"\n", working);

    first_word(line, word, sizeof word);
    printf("First word: \"%s\"\n", word);

    pause_at_exit();
    return 0;
}
