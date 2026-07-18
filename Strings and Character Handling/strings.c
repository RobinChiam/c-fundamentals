/*
 * Lesson 7 — Strings and Character Handling
 *
 * Goal: read a line safely with fgets, strip the trailing newline, classify
 * characters with <ctype.h>, copy into a sized buffer, and compare text
 * without caring about letter case.
 *
 * WHY: C strings are char arrays ending in '\0'. There is no built-in length
 * field — every library routine trusts that terminator and your buffer size.
 *
 * NEVER use gets(). It cannot limit how many characters are written.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic strings.c -o strings.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define LINE_SIZE 128
#define COPY_SIZE 64

/* Windows-console convenience — not part of the language lesson. */
static void pause_at_exit(void)
{
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

/* fgets keeps the newline when the line fits. Strip it so later strcmp /
 * strcat logic does not treat "\n" as part of the text. */
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

/* Safer than strcpy when the destination has a known capacity:
 * copy at most dest_size-1 characters, then always write '\0'. */
static void safe_copy(char *dest, size_t dest_size, const char *src)
{
    size_t i = 0;

    if (dest == NULL || dest_size == 0U) {
        return;
    }
    if (src == NULL) {
        dest[0] = '\0';
        return;
    }

    while (i + 1U < dest_size && src[i] != '\0') {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

/* Case-insensitive compare: fold both sides with tolower before comparing.
 * Returns 0 when equal (same idea as strcmp). */
static int strcmp_ignore_case(const char *a, const char *b)
{
    unsigned char ca = 0;
    unsigned char cb = 0;

    if (a == NULL || b == NULL) {
        return (a == b) ? 0 : (a == NULL ? -1 : 1);
    }

    while (*a != '\0' && *b != '\0') {
        ca = (unsigned char)*a;
        cb = (unsigned char)*b;
        /* Cast to unsigned char before ctype macros — required for safety. */
        if (tolower(ca) != tolower(cb)) {
            return (tolower(ca) < tolower(cb)) ? -1 : 1;
        }
        a++;
        b++;
    }

    if (*a == *b) {
        return 0;
    }
    return (*a == '\0') ? -1 : 1;
}

static void classify_characters(const char *text)
{
    size_t i = 0;
    int letters = 0;
    int digits = 0;
    int spaces = 0;
    int others = 0;

    printf("Classification of \"%s\":\n", text);
    for (i = 0; text[i] != '\0'; i++) {
        unsigned char ch = (unsigned char)text[i];

        if (isalpha(ch)) {
            letters++;
            printf("  '%c' isalpha\n", text[i]);
        } else if (isdigit(ch)) {
            digits++;
            printf("  '%c' isdigit\n", text[i]);
        } else if (isspace(ch)) {
            spaces++;
            printf("  whitespace\n");
        } else {
            others++;
            printf("  '%c' other\n", text[i]);
        }
    }
    printf("Counts — letters:%d digits:%d spaces:%d others:%d\n",
           letters, digits, spaces, others);
}

int main(void)
{
    char line[LINE_SIZE];
    char copy[COPY_SIZE];
    char keyword[LINE_SIZE];
    size_t len = 0;

    /* Always initialize buffers you will print or compare. */
    line[0] = '\0';
    copy[0] = '\0';
    keyword[0] = '\0';

    printf("=== Lesson 7: Strings and Character Handling ===\n");
    printf("Enter a short line of text:\n> ");
    fflush(stdout);

    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        printf("No input available.\n");
        pause_at_exit();
        return 1;
    }
    strip_trailing_newline(line);

    len = strlen(line);
    printf("Length (strlen): %zu\n", len);

    safe_copy(copy, sizeof copy, line);
    printf("Safe copy into %d-byte buffer: \"%s\"\n", COPY_SIZE, copy);

    /* Demonstrate strcmp (case-sensitive) vs our ignore-case helper. */
    printf("Enter a keyword to compare against your line:\n> ");
    fflush(stdout);
    if (fgets(keyword, (int)sizeof keyword, stdin) == NULL) {
        printf("No keyword.\n");
        pause_at_exit();
        return 1;
    }
    strip_trailing_newline(keyword);

    if (strcmp(line, keyword) == 0) {
        printf("strcmp: exact match.\n");
    } else {
        printf("strcmp: not an exact match.\n");
    }

    if (strcmp_ignore_case(line, keyword) == 0) {
        printf("strcmp_ignore_case: match (ignoring case).\n");
    } else {
        printf("strcmp_ignore_case: different.\n");
    }

    classify_characters(line);

    /* strcat caution: only append when remaining space is known.
     * Here we rebuild a small greeting in `copy` with room checks. */
    {
        char greeting[COPY_SIZE];

        safe_copy(greeting, sizeof greeting, "Hello, ");
        /* Manual append with bounds — safer teaching pattern than naked strcat. */
        {
            size_t used = strlen(greeting);
            size_t j = 0;

            while (used + 1U < sizeof greeting && line[j] != '\0') {
                greeting[used] = line[j];
                used++;
                j++;
            }
            if (used + 1U < sizeof greeting) {
                greeting[used++] = '!';
            }
            greeting[used] = '\0';
        }
        printf("Bounded greeting: \"%s\"\n", greeting);
    }

    pause_at_exit();
    return 0;
}
