/*
 * geometry.h — public interface for simple 2D geometry helpers.
 *
 * Include guards prevent double inclusion when multiple .c files include
 * this header (directly or indirectly). Headers should declare prototypes
 * and types — put function bodies in geometry.c, not here.
 */

#ifndef GEOMETRY_H
#define GEOMETRY_H

/*
 * Rectangle described by width and height (both must be positive for area/
 * perimeter helpers to succeed).
 */
typedef struct {
    double width;
    double height;
} Rect;

/*
 * Circle described by radius (must be positive for area/circumference).
 */
typedef struct {
    double radius;
} Circle;

/* Return the area of a rectangle, or -1.0 if dimensions are invalid. */
double rect_area(const Rect *r);

/* Return the perimeter of a rectangle, or -1.0 if dimensions are invalid. */
double rect_perimeter(const Rect *r);

/* Return the area of a circle (pi * r^2), or -1.0 if radius is invalid. */
double circle_area(const Circle *c);

/* Return the circumference (2 * pi * r), or -1.0 if radius is invalid. */
double circle_circumference(const Circle *c);

/*
 * Approximate Euclidean distance between (x1,y1) and (x2,y2).
 * Always succeeds for finite inputs.
 */
double point_distance(double x1, double y1, double x2, double y2);

#endif /* GEOMETRY_H */
