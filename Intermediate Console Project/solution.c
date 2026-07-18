/*
 * Lesson 14 — Exercise / enhancement demo: filter tasks by status
 *
 * README enhancement exercises include filtering the list by status.
 * This program reuses task.c, store.c, and util.c. It loads tasks.txt
 * (if present), asks for a status, and prints matching tasks only.
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

/*
 * Optional demo: also count how many tasks are at each priority — another
 * README-style enhancement without changing the main tracker binary.
 */
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

int main(void)
{
    TaskStore store;
    char line[64];
    TaskStatus status;

    store_init(&store);

    printf("Lesson 14 — solution.c (filter-by-status enhancement)\n");
    printf("Loads %s if available, then filters by status.\n\n", DEFAULT_SAVE_PATH);

    if (!store_load(&store, DEFAULT_SAVE_PATH)) {
        printf("No save file found — seeding two sample tasks in memory.\n");
        (void)store_add(&store, "Write README notes", TASK_TODO, PRIORITY_HIGH);
        (void)store_add(&store, "Review store_load", TASK_DOING, PRIORITY_MEDIUM);
        (void)store_add(&store, "Celebrate compile", TASK_DONE, PRIORITY_LOW);
    } else {
        printf("Loaded %zu task(s).\n", store.count);
    }

    printf("\nFull list:\n");
    store_print_all(&store);

    printf("\nFilter status (todo/doing/done): ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) || !task_parse_status(line, &status)) {
        printf("Invalid status — defaulting to todo.\n");
        status = TASK_TODO;
    }

    print_filtered(&store, status);
    print_priority_counts(&store);

    store_free(&store);
    util_pause_at_exit();
    return 0;
}
