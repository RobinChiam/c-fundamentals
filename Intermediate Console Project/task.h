/*
 * task.h — Task record type and small helpers (no I/O ownership here).
 */

#ifndef TASK_H
#define TASK_H

#include <stddef.h>

#define TASK_TITLE_MAX 80

typedef enum {
    TASK_TODO = 0,
    TASK_DOING = 1,
    TASK_DONE = 2
} TaskStatus;

typedef enum {
    PRIORITY_LOW = 0,
    PRIORITY_MEDIUM = 1,
    PRIORITY_HIGH = 2
} TaskPriority;

typedef struct {
    int id;
    char title[TASK_TITLE_MAX];
    TaskStatus status;
    TaskPriority priority;
} Task;

/* Fill a Task; copies title when valid (non-empty, no | or newlines, fits buffer). */
int task_make(Task *out, int id, const char *title, TaskStatus status,
              TaskPriority priority);

/* Compare by priority descending, then id ascending. Returns <0, 0, >0. */
int task_compare_priority_desc(const Task *a, const Task *b);

/* Compare by id ascending. */
int task_compare_id_asc(const Task *a, const Task *b);

const char *task_status_name(TaskStatus status);
const char *task_priority_name(TaskPriority priority);

/* Parse status/priority names (case-sensitive short tokens). Return 1 on ok. */
int task_parse_status(const char *text, TaskStatus *out);
int task_parse_priority(const char *text, TaskPriority *out);

#endif /* TASK_H */
