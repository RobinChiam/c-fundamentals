/*
 * util.h — small input helpers shared by the task tracker.
 */

#ifndef UTIL_H
#define UTIL_H

#include <stddef.h>

/* Read a line with fgets; strip trailing newline. Returns 1 on success. */
int util_read_line(char *buffer, size_t size);

/*
 * Parse a long in [min_value, max_value] from text already read with fgets.
 * Rejects leftover junk. Returns 1 on success.
 */
int util_parse_long_range(const char *text, long min_value, long max_value,
                          long *out_value);

/* Platform convenience: wait for Enter before process exit. */
void util_pause_at_exit(void);

#endif /* UTIL_H */
