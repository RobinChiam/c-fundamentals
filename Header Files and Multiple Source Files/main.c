/*
 * Lesson 12 — Header Files and Multiple Source Files
 *
 * main.c owns the program entry point and user interaction.
 * geometry.c / geometry.h own reusable math helpers.
 *
 * Compile ALL sources together:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic main.c geometry.c -o geometry_demo.exe -lm
 *
 * On MinGW/Windows, -lm is often unnecessary but harmless; on Linux it links libm.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "geometry.h"

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

static int parse_positive_double(const char *text, double *out_value)
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
    if (!(value > 0.0)) {
        return 0;
    }

    *out_value = value;
    return 1;
}

/* Platform convenience: keeps a Windows console open until Enter. */
static void pause_at_exit(void)
{
    char line[8];

    printf("\nPress Enter to exit...");
    fflush(stdout);
    if (fgets(line, (int)sizeof line, stdin) == NULL) {
        /* ignore */
    }
}

static void demo_rectangle(void)
{
    char line[128];
    Rect r;
    double area;
    double peri;

    printf("\n--- Rectangle ---\n");
    printf("width (> 0): ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &r.width)) {
        printf("Invalid width — skipping rectangle demo.\n");
        return;
    }

    printf("height (> 0): ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &r.height)) {
        printf("Invalid height — skipping rectangle demo.\n");
        return;
    }

    area = rect_area(&r);
    peri = rect_perimeter(&r);
    if (area < 0.0 || peri < 0.0) {
        printf("Rectangle helpers rejected the dimensions.\n");
        return;
    }

    printf("Rect %.3f x %.3f -> area=%.3f perimeter=%.3f\n",
           r.width, r.height, area, peri);
}

static void demo_circle(void)
{
    char line[128];
    Circle c;
    double area;
    double circ;

    printf("\n--- Circle ---\n");
    printf("radius (> 0): ");
    fflush(stdout);
    if (!read_line(line, sizeof line) || !parse_positive_double(line, &c.radius)) {
        printf("Invalid radius — skipping circle demo.\n");
        return;
    }

    area = circle_area(&c);
    circ = circle_circumference(&c);
    if (area < 0.0 || circ < 0.0) {
        printf("Circle helpers rejected the radius.\n");
        return;
    }

    printf("Circle r=%.3f -> area=%.3f circumference=%.3f\n",
           c.radius, area, circ);
}

static void demo_distance(void)
{
    /*
     * Fixed points keep this demo short; exercises ask you to read coordinates.
     * Distance logic lives in geometry.c — main only prints the result.
     */
    double d = point_distance(0.0, 0.0, 3.0, 4.0);

    printf("\n--- Distance ---\n");
    printf("Distance from (0,0) to (3,4) = %.3f (expect 5.000)\n", d);
}

int main(void)
{
    printf("=== Lesson 12: Header Files and Multiple Source Files ===\n");
    printf("main.c talks to the user; geometry.c does the math.\n");

    demo_rectangle();
    demo_circle();
    demo_distance();

    pause_at_exit();
    return 0;
}
