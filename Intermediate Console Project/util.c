/*
 * util.c — implementations for util.h
 */

#include "util.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int util_read_line(char *buffer, size_t size)
{
    if (buffer == NULL || size == 0U) {
        return 0;
    }
    if (fgets(buffer, (int)size, stdin) == NULL) {
        return 0;
    }
    buffer[strcspn(buffer, "\n")] = '\0';
    return 1;
}

int util_parse_long_range(const char *text, long min_value, long max_value,
                          long *out_value)
{
    char *end = NULL;
    long value;

    if (text == NULL || out_value == NULL) {
        return 0;
    }
    while (*text == ' ' || *text == '\t') {
        text++;
    }
    if (*text == '\0') {
        return 0;
    }

    value = strtol(text, &end, 10);
    if (end == text) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    if (value < min_value || value > max_value) {
        return 0;
    }

    *out_value = value;
    return 1;
}

void util_pause_at_exit(void)
{
    char line[8];

    printf("\nPress Enter to exit...");
    fflush(stdout);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        /* ignore EOF */
    }
}
