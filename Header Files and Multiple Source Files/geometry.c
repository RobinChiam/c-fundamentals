/*
 * geometry.c — implementations matching geometry.h
 *
 * Compile this file together with main.c (see README). Do not put a main()
 * here; this translation unit is a library module.
 */

#include "geometry.h"

#include <math.h>
#include <stddef.h>

#ifndef M_PI
/* C17 does not require M_PI; provide a local constant if missing. */
#define M_PI 3.14159265358979323846
#endif

static int rect_valid(const Rect *r)
{
    return r != NULL && r->width > 0.0 && r->height > 0.0;
}

static int circle_valid(const Circle *c)
{
    return c != NULL && c->radius > 0.0;
}

double rect_area(const Rect *r)
{
    if (!rect_valid(r)) {
        return -1.0;
    }
    return r->width * r->height;
}

double rect_perimeter(const Rect *r)
{
    if (!rect_valid(r)) {
        return -1.0;
    }
    return 2.0 * (r->width + r->height);
}

double circle_area(const Circle *c)
{
    if (!circle_valid(c)) {
        return -1.0;
    }
    return M_PI * c->radius * c->radius;
}

double circle_circumference(const Circle *c)
{
    if (!circle_valid(c)) {
        return -1.0;
    }
    return 2.0 * M_PI * c->radius;
}

double point_distance(double x1, double y1, double x2, double y2)
{
    double dx = x2 - x1;
    double dy = y2 - y1;
    return sqrt(dx * dx + dy * dy);
}
