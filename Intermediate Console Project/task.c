/*
 * task.c — Task helpers
 */

#include "task.h"

#include <string.h>

int task_make(Task *out, int id, const char *title, TaskStatus status,
              TaskPriority priority)
{
    if (out == NULL || title == NULL) {
        return 0;
    }
    if (title[0] == '\0') {
        return 0;
    }

    out->id = id;
    out->status = status;
    out->priority = priority;

    /*
     * Manual bounded copy: leave room for '\0'. snprintf is also fine;
     * this keeps the dependency surface tiny and obvious for learners.
     */
    {
        size_t i;
        for (i = 0U; i + 1U < TASK_TITLE_MAX && title[i] != '\0'; i++) {
            out->title[i] = title[i];
        }
        out->title[i] = '\0';
    }
    return 1;
}

int task_compare_priority_desc(const Task *a, const Task *b)
{
    if (a == NULL || b == NULL) {
        return 0;
    }
    if (a->priority != b->priority) {
        return (a->priority > b->priority) ? -1 : 1;
    }
    if (a->id < b->id) {
        return -1;
    }
    if (a->id > b->id) {
        return 1;
    }
    return 0;
}

int task_compare_id_asc(const Task *a, const Task *b)
{
    if (a == NULL || b == NULL) {
        return 0;
    }
    if (a->id < b->id) {
        return -1;
    }
    if (a->id > b->id) {
        return 1;
    }
    return 0;
}

const char *task_status_name(TaskStatus status)
{
    switch (status) {
    case TASK_TODO:
        return "todo";
    case TASK_DOING:
        return "doing";
    case TASK_DONE:
        return "done";
    default:
        return "unknown";
    }
}

const char *task_priority_name(TaskPriority priority)
{
    switch (priority) {
    case PRIORITY_LOW:
        return "low";
    case PRIORITY_MEDIUM:
        return "medium";
    case PRIORITY_HIGH:
        return "high";
    default:
        return "unknown";
    }
}

int task_parse_status(const char *text, TaskStatus *out)
{
    if (text == NULL || out == NULL) {
        return 0;
    }
    if (strcmp(text, "todo") == 0) {
        *out = TASK_TODO;
        return 1;
    }
    if (strcmp(text, "doing") == 0) {
        *out = TASK_DOING;
        return 1;
    }
    if (strcmp(text, "done") == 0) {
        *out = TASK_DONE;
        return 1;
    }
    return 0;
}

int task_parse_priority(const char *text, TaskPriority *out)
{
    if (text == NULL || out == NULL) {
        return 0;
    }
    if (strcmp(text, "low") == 0) {
        *out = PRIORITY_LOW;
        return 1;
    }
    if (strcmp(text, "medium") == 0) {
        *out = PRIORITY_MEDIUM;
        return 1;
    }
    if (strcmp(text, "high") == 0) {
        *out = PRIORITY_HIGH;
        return 1;
    }
    return 0;
}
