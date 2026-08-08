/*
 * Lesson 14 — Exercise / enhancement demo
 *
 * Demonstrates README enhancements:
 *   1) Filter tasks by status
 *   2) Priority counts
 *   3) Edit a task title safely
 *   4) Sort by id with store_sort_by_id
 *
 * Compile with the project modules:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c task.c store.c util.c -o solution.exe
 */

#include <stdio.h>

#include "store.h"
#include "util.h"

#define DEFAULT_SAVE_PATH "tasks.txt"

static void print_filtered(const TaskStore *store, TaskStatus status)
{
    size_t i;
    size_t shown = 0U;

    if (store == NULL) {
        return;
    }

    printf("\nTasks with status '%s':\n", task_status_name(status));
    printf("%-4s %-8s %-8s %s\n", "ID", "STATUS", "PRIORITY", "TITLE");
    printf("%-4s %-8s %-8s %s\n", "--", "------", "--------", "-----");

    for (i = 0U; i < store->count; i++) {
        const Task *t = &store->items[i];
        if (t->status != status) {
            continue;
        }
        printf("%-4d %-8s %-8s %s\n",
               t->id,
               task_status_name(t->status),
               task_priority_name(t->priority),
               t->title);
        shown += 1U;
    }

    if (shown == 0U) {
        printf("(none)\n");
    } else {
        printf("(%zu match(es))\n", shown);
    }
}

static void print_priority_counts(const TaskStore *store)
{
    size_t i;
    size_t low = 0U;
    size_t medium = 0U;
    size_t high = 0U;

    if (store == NULL) {
        return;
    }
    for (i = 0U; i < store->count; i++) {
        switch (store->items[i].priority) {
        case PRIORITY_LOW:
            low += 1U;
            break;
        case PRIORITY_MEDIUM:
            medium += 1U;
            break;
        case PRIORITY_HIGH:
            high += 1U;
            break;
        default:
            break;
        }
    }
    printf("\nPriority counts: low=%zu medium=%zu high=%zu\n", low, medium, high);
}

static int edit_task_title(TaskStore *store, int id, const char *new_title)
{
    Task *existing = NULL;
    Task updated;

    if (store == NULL) {
        return 0;
    }
    existing = store_find_by_id(store, id);
    if (existing == NULL) {
        return 0;
    }
    if (!task_make(&updated, existing->id, new_title, existing->status,
                   existing->priority)) {
        return 0;
    }
    *existing = updated;
    return 1;
}

int main(void)
{
    TaskStore store;
    char line[64];
    TaskStatus status;

    store_init(&store);

    printf("Lesson 14 — solution.c (enhancement demos)\n");
    printf("Loads %s if available, then runs enhancement examples.\n\n",
           DEFAULT_SAVE_PATH);

    if (!store_load(&store, DEFAULT_SAVE_PATH)) {
        printf("No save file found — seeding three sample tasks in memory.\n");
        (void)store_add(&store, "Write README notes", TASK_TODO, PRIORITY_HIGH);
        (void)store_add(&store, "Review store_load", TASK_DOING, PRIORITY_MEDIUM);
        (void)store_add(&store, "Celebrate compile", TASK_DONE, PRIORITY_LOW);
    } else {
        printf("Loaded %zu task(s).\n", store.count);
    }

    printf("\nFull list (insertion order):\n");
    store_print_all(&store);

    printf("\nFilter status (todo/doing/done): ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) || !task_parse_status(line, &status)) {
        printf("Invalid status — defaulting to todo.\n");
        status = TASK_TODO;
    }
    print_filtered(&store, status);
    print_priority_counts(&store);

    printf("\n--- Enhancement 3: edit title for task id 1 ---\n");
    if (edit_task_title(&store, 1, "Updated README notes")) {
        printf("Title updated for id 1.\n");
    } else {
        printf("Could not update title (missing id or invalid title).\n");
    }

    printf("\n--- Enhancement 4: sort by id ---\n");
    store_sort_by_id(&store);
    store_print_all(&store);

    store_free(&store);
    util_pause_at_exit();
    return 0;
}
