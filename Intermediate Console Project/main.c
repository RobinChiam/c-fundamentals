/*
 * Lesson 14 — Intermediate Console Project: Task Tracker
 *
 * Menu-driven program combining structures, enums, dynamic memory,
 * searching/sorting, and text-file persistence across multiple modules.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic main.c task.c store.c util.c -o task_tracker.exe
 */

#include <stdio.h>
#include <string.h>

#include "store.h"
#include "util.h"

#define DEFAULT_SAVE_PATH "tasks.txt"

static void print_menu(void)
{
    printf("\n======== Task Tracker ========\n");
    printf("1) List tasks\n");
    printf("2) Add task\n");
    printf("3) Remove task by id\n");
    printf("4) Find by id\n");
    printf("5) Find title contains\n");
    printf("6) Sort by priority (high first)\n");
    printf("7) Save to file\n");
    printf("8) Load from file\n");
    printf("9) Update status\n");
    printf("0) Quit\n");
    printf("Choice: ");
    fflush(stdout);
}

static int title_is_safe(const char *title)
{
    if (title == NULL || title[0] == '\0') {
        return 0;
    }
    /* Keep the on-disk format simple: no '|' or newline in titles. */
    if (strchr(title, '|') != NULL || strchr(title, '\n') != NULL) {
        return 0;
    }
    return 1;
}

static void action_add(TaskStore *store)
{
    char title[TASK_TITLE_MAX];
    char line[64];
    TaskStatus status = TASK_TODO;
    TaskPriority priority = PRIORITY_MEDIUM;

    printf("Title: ");
    fflush(stdout);
    if (!util_read_line(title, sizeof title) || !title_is_safe(title)) {
        printf("Invalid title (non-empty, no '|' characters).\n");
        return;
    }

    printf("Status (todo/doing/done) [todo]: ");
    fflush(stdout);
    if (util_read_line(line, sizeof line) && line[0] != '\0') {
        if (!task_parse_status(line, &status)) {
            printf("Unknown status — using todo.\n");
            status = TASK_TODO;
        }
    }

    printf("Priority (low/medium/high) [medium]: ");
    fflush(stdout);
    if (util_read_line(line, sizeof line) && line[0] != '\0') {
        if (!task_parse_priority(line, &priority)) {
            printf("Unknown priority — using medium.\n");
            priority = PRIORITY_MEDIUM;
        }
    }

    if (!store_add(store, title, status, priority)) {
        printf("Could not add task (memory or validation failure).\n");
        return;
    }
    printf("Added task id %d.\n", store->next_id - 1);
}

static void action_remove(TaskStore *store)
{
    char line[64];
    long id;

    printf("Id to remove: ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) ||
        !util_parse_long_range(line, 1L, 1000000L, &id)) {
        printf("Invalid id.\n");
        return;
    }
    if (store_remove_by_id(store, (int)id)) {
        printf("Removed task %ld.\n", id);
    } else {
        printf("No task with id %ld.\n", id);
    }
}

static void action_find_id(TaskStore *store)
{
    char line[64];
    long id;
    Task *t;

    printf("Id to find: ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) ||
        !util_parse_long_range(line, 1L, 1000000L, &id)) {
        printf("Invalid id.\n");
        return;
    }
    t = store_find_by_id(store, (int)id);
    if (t == NULL) {
        printf("Not found.\n");
        return;
    }
    printf("Found: id=%d status=%s priority=%s title=\"%s\"\n",
           t->id,
           task_status_name(t->status),
           task_priority_name(t->priority),
           t->title);
}

static void action_find_title(TaskStore *store)
{
    char needle[TASK_TITLE_MAX];
    Task *t;

    printf("Substring: ");
    fflush(stdout);
    if (!util_read_line(needle, sizeof needle) || needle[0] == '\0') {
        printf("Empty substring.\n");
        return;
    }
    t = store_find_title_contains(store, needle);
    if (t == NULL) {
        printf("No title contains \"%s\".\n", needle);
        return;
    }
    printf("First match: id=%d title=\"%s\"\n", t->id, t->title);
}

static void action_update_status(TaskStore *store)
{
    char line[64];
    long id;
    Task *t;
    TaskStatus status;

    printf("Id to update: ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) ||
        !util_parse_long_range(line, 1L, 1000000L, &id)) {
        printf("Invalid id.\n");
        return;
    }
    t = store_find_by_id(store, (int)id);
    if (t == NULL) {
        printf("Not found.\n");
        return;
    }
    printf("New status (todo/doing/done): ");
    fflush(stdout);
    if (!util_read_line(line, sizeof line) || !task_parse_status(line, &status)) {
        printf("Invalid status.\n");
        return;
    }
    t->status = status;
    printf("Updated task %ld to %s.\n", id, task_status_name(status));
}

int main(void)
{
    TaskStore store;
    char line[64];
    long choice;
    int running = 1;

    store_init(&store);

    printf("=== Lesson 14: Intermediate Console Project ===\n");
    printf("Task Tracker (educational). Default file: %s\n", DEFAULT_SAVE_PATH);
    {
        FILE *probe = fopen(DEFAULT_SAVE_PATH, "r");
        if (probe == NULL) {
            printf("No existing save found (starting empty).\n");
        } else {
            fclose(probe);
            if (store_load(&store, DEFAULT_SAVE_PATH)) {
                printf("Loaded %zu task(s) from %s.\n", store.count, DEFAULT_SAVE_PATH);
            } else {
                printf("Could not load %s (file is corrupt or invalid).\n",
                       DEFAULT_SAVE_PATH);
            }
        }
    }

    while (running) {
        print_menu();
        if (!util_read_line(line, sizeof line) ||
            !util_parse_long_range(line, 0L, 9L, &choice)) {
            printf("Please enter a menu number 0-9.\n");
            continue;
        }

        switch ((int)choice) {
        case 1:
            store_print_all(&store);
            break;
        case 2:
            action_add(&store);
            break;
        case 3:
            action_remove(&store);
            break;
        case 4:
            action_find_id(&store);
            break;
        case 5:
            action_find_title(&store);
            break;
        case 6:
            store_sort_by_priority(&store);
            printf("Sorted by priority (high first).\n");
            store_print_all(&store);
            break;
        case 7:
            if (store_save(&store, DEFAULT_SAVE_PATH)) {
                printf("Saved %zu task(s) to %s.\n", store.count, DEFAULT_SAVE_PATH);
            }
            break;
        case 8:
            if (store_load(&store, DEFAULT_SAVE_PATH)) {
                printf("Loaded %zu task(s) from %s.\n", store.count, DEFAULT_SAVE_PATH);
            } else {
                printf("Load failed or file missing.\n");
            }
            break;
        case 9:
            action_update_status(&store);
            break;
        case 0:
            running = 0;
            break;
        default:
            printf("Unknown choice.\n");
            break;
        }
    }

    /* Offer a final save so work is not lost on quit. */
    printf("Save before exit? (y/N): ");
    fflush(stdout);
    if (util_read_line(line, sizeof line) &&
        (line[0] == 'y' || line[0] == 'Y')) {
        if (store_save(&store, DEFAULT_SAVE_PATH)) {
            printf("Saved to %s.\n", DEFAULT_SAVE_PATH);
        }
    }

    store_free(&store);
    util_pause_at_exit();
    return 0;
}
