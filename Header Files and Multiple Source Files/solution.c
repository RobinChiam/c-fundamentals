/*
 * Lesson 12 — Exercise solutions
 *
 * Exercises (see README.md):
 *   1) Read two points and print their distance using point_distance().
 *   2) Compare rectangle area vs circle area for user-supplied sizes.
 *   3) Conceptual: why include guards matter (explained in comments below).
 *
 * This file is a standalone exercise driver that still uses the geometry
 * library — link geometry.c:
 *
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c geometry.c -o solution.exe -lm
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "geometry.h"

/*
 * Include-guard reminder (Exercise 3):
 * If geometry.h lacked #ifndef GEOMETRY_H / #define / #endif, including it
 * twice in one translation unit would redefine Rect/Circle and redeclare
 * functions — often as a compile error. Guards make repeated inclusion safe.
 */

static int read_line(char *buffer, size_t size)
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

static int parse_double(const char *text, double *out_value)
{
    char *end = NULL;
    double value;

    if (text == NULL || out_value == NULL) {
        return 0;
    }
    while (*text == ' ' || *text == '\t') {
        text++;
    }
    if (*text == '\0') {
        return 0;
    }

    value = strtod(text, &end);
    if (end == text) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }

    *out_value = value;
    return 1;
}

static int parse_positive_double(const char *text, double *out_value)
{
    if (!parse_double(text, out_value)) {
        return 0;
    }
    return *out_value > 0.0;
}

/* Platform convenience — not a C language concept. */
static void pause_at_exit(void)
{
    char line[8];

    printf("\nPress Enter to exit...");
    fflush(stdout);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        /* ignore */
    }
}

static void exercise_distance(void)
{
    char line[128];
    double x1, y1, x2, y2;

    printf("\n=== Exercise 1: distance between two points ===\n");

    printf("x1: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_double(line, &x1)) {
        printf("Invalid — skipping.\n");
        return;
    }
    printf("y1: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_double(line, &y1)) {
        printf("Invalid — skipping.\n");
        return;
    }
    printf("x2: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_double(line, &x2)) {
        printf("Invalid — skipping.\n");
        return;
    }
    printf("y2: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_double(line, &y2)) {
        printf("Invalid — skipping.\n");
        return;
    }

    printf("Distance = %.6f\n", point_distance(x1, y1, x2, y2));
}

static void exercise_compare_areas(void)
{
    char line[128];
    Rect r;
    Circle c;
    double ra;
    double ca;

    printf("\n=== Exercise 2: rectangle area vs circle area ===\n");

    printf("rect width: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &r.width)) {
        printf("Invalid — skipping.\n");
        return;
    }
    printf("rect height: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &r.height)) {
        printf("Invalid — skipping.\n");
        return;
    }
    printf("circle radius: ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &c.radius)) {
        printf("Invalid — skipping.\n");
        return;
    }

    ra = rect_area(&r);
    ca = circle_area(&c);
    if (ra < 0.0 || ca < 0.0) {
        printf("Helpers rejected one of the shapes.\n");
        return;
    }

    printf("Rectangle area: %.6f\n", ra);
    printf("Circle area:    %.6f\n", ca);
    if (ra > ca) {
        printf("Rectangle is larger.\n");
    } else if (ca > ra) {
        printf("Circle is larger.\n");
    } else {
        printf("Areas are equal.\n");
    }
}

int main(void)
{
    printf("Lesson 12 — solution.c (exercise answers)\n");
    printf("Links against geometry.c — see compile line in the file header.\n");

    exercise_distance();
    exercise_compare_areas();

    printf("\n=== Exercise 3 note ===\n");
    printf("Include guards in geometry.h prevent duplicate type/prototype\n");
    printf("definitions when the header is included more than once.\n");

    pause_at_exit();
    return 0;
}
