/*
 * store.c — dynamic task store + file persistence
 */

#include "store.h"

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

void store_init(TaskStore *store)
{
    if (store == NULL) {
        return;
    }
    store->items = NULL;
    store->count = 0U;
    store->capacity = 0U;
    store->next_id = 1;
}

void store_free(TaskStore *store)
{
    if (store == NULL) {
        return;
    }
    free(store->items);
    store->items = NULL;
    store->count = 0U;
    store->capacity = 0U;
    store->next_id = 1;
}

static int store_reserve(TaskStore *store, size_t needed)
{
    size_t new_cap;
    Task *grown;

    if (store == NULL) {
        return 0;
    }
    if (needed <= store->capacity) {
        return 1;
    }

    new_cap = (store->capacity == 0U) ? 4U : store->capacity;
    while (new_cap < needed) {
        if (new_cap > (SIZE_MAX / 2U)) {
            new_cap = needed;
            break;
        }
        new_cap *= 2U;
    }

    grown = realloc(store->items, new_cap * sizeof *grown);
    if (grown == NULL) {
        fprintf(stderr, "Error: could not grow task store.\n");
        return 0;
    }
    store->items = grown;
    store->capacity = new_cap;
    return 1;
}

int store_add(TaskStore *store, const char *title, TaskStatus status,
              TaskPriority priority)
{
    Task task;

    if (store == NULL) {
        return 0;
    }
    if (!task_make(&task, store->next_id, title, status, priority)) {
        return 0;
    }
    if (!store_reserve(store, store->count + 1U)) {
        return 0;
    }

    store->items[store->count] = task;
    store->count += 1U;
    store->next_id += 1;
    return 1;
}

int store_remove_by_id(TaskStore *store, int id)
{
    size_t i;

    if (store == NULL || store->items == NULL) {
        return 0;
    }
    for (i = 0U; i < store->count; i++) {
        if (store->items[i].id == id) {
            size_t j;
            for (j = i + 1U; j < store->count; j++) {
                store->items[j - 1U] = store->items[j];
            }
            store->count -= 1U;
            return 1;
        }
    }
    return 0;
}

Task *store_find_by_id(TaskStore *store, int id)
{
    size_t i;

    if (store == NULL || store->items == NULL) {
        return NULL;
    }
    for (i = 0U; i < store->count; i++) {
        if (store->items[i].id == id) {
            return &store->items[i];
        }
    }
    return NULL;
}

Task *store_find_title_contains(TaskStore *store, const char *needle)
{
    size_t i;

    if (store == NULL || store->items == NULL || needle == NULL || needle[0] == '\0') {
        return NULL;
    }
    for (i = 0U; i < store->count; i++) {
        if (strstr(store->items[i].title, needle) != NULL) {
            return &store->items[i];
        }
    }
    return NULL;
}

void store_sort_by_priority(TaskStore *store)
{
    size_t i;
    size_t j;

    /* Insertion sort — fine for a small educational task list. */
    if (store == NULL || store->items == NULL || store->count < 2U) {
        return;
    }
    for (i = 1U; i < store->count; i++) {
        Task key = store->items[i];
        j = i;
        while (j > 0U &&
               task_compare_priority_desc(&store->items[j - 1U], &key) > 0) {
            store->items[j] = store->items[j - 1U];
            j -= 1U;
        }
        store->items[j] = key;
    }
}

void store_sort_by_id(TaskStore *store)
{
    size_t i;
    size_t j;

    if (store == NULL || store->items == NULL || store->count < 2U) {
        return;
    }
    for (i = 1U; i < store->count; i++) {
        Task key = store->items[i];
        j = i;
        while (j > 0U && task_compare_id_asc(&store->items[j - 1U], &key) > 0) {
            store->items[j] = store->items[j - 1U];
            j -= 1U;
        }
        store->items[j] = key;
    }
}

void store_print_all(const TaskStore *store)
{
    size_t i;

    if (store == NULL) {
        return;
    }
    if (store->count == 0U) {
        printf("(no tasks)\n");
        return;
    }
    printf("%-4s %-8s %-8s %s\n", "ID", "STATUS", "PRIORITY", "TITLE");
    printf("%-4s %-8s %-8s %s\n", "--", "------", "--------", "-----");
    for (i = 0U; i < store->count; i++) {
        const Task *t = &store->items[i];
        printf("%-4d %-8s %-8s %s\n",
               t->id,
               task_status_name(t->status),
               task_priority_name(t->priority),
               t->title);
    }
}

int store_save(const TaskStore *store, const char *path)
{
    FILE *fp;
    size_t i;

    if (store == NULL || path == NULL) {
        return 0;
    }

    fp = fopen(path, "w");
    if (fp == NULL) {
        fprintf(stderr, "Error: could not open '%s' for writing.\n", path);
        return 0;
    }

    for (i = 0U; i < store->count; i++) {
        const Task *t = &store->items[i];
        /*
         * Titles must not contain '|' or newlines for this simple format.
         * The UI rejects those characters when adding tasks.
         */
        if (fprintf(fp, "%d|%s|%s|%s\n",
                    t->id,
                    task_status_name(t->status),
                    task_priority_name(t->priority),
                    t->title) < 0) {
            fprintf(stderr, "Error: write failed for '%s'.\n", path);
            fclose(fp);
            return 0;
        }
    }

    if (fclose(fp) != 0) {
        fprintf(stderr, "Error: could not close '%s' after save.\n", path);
        return 0;
    }
    return 1;
}

int store_load(TaskStore *store, const char *path)
{
    FILE *fp;
    char line[256];
    int max_id = 0;

    if (store == NULL || path == NULL) {
        return 0;
    }

    fp = fopen(path, "r");
    if (fp == NULL) {
        /* Missing file is a soft failure for first-run UX. */
        return 0;
    }

    store_free(store);
    store_init(store);

    while (fgets(line, (int)sizeof line, fp) != NULL) {
        char *nl;
        char *p_id;
        char *p_status;
        char *p_priority;
        char *p_title;
        char *cursor;
        long id_long;
        TaskStatus status;
        TaskPriority priority;
        Task task;
        char *end = NULL;

        nl = strchr(line, '\n');
        if (nl != NULL) {
            *nl = '\0';
        }
        if (line[0] != '\0') {
            size_t line_len = strlen(line);
            if (line[line_len - 1U] == '\r') {
                line[line_len - 1U] = '\0';
            }
        }
        if (line[0] == '\0') {
            continue;
        }

        cursor = line;
        p_id = cursor;
        cursor = strchr(cursor, '|');
        if (cursor == NULL) {
            goto fail;
        }
        *cursor = '\0';
        cursor++;

        p_status = cursor;
        cursor = strchr(cursor, '|');
        if (cursor == NULL) {
            goto fail;
        }
        *cursor = '\0';
        cursor++;

        p_priority = cursor;
        cursor = strchr(cursor, '|');
        if (cursor == NULL) {
            goto fail;
        }
        *cursor = '\0';
        cursor++;
        p_title = cursor;

        id_long = strtol(p_id, &end, 10);
        if (end == p_id || *end != '\0' || id_long < 1L || id_long > 1000000L) {
            goto fail;
        }
        if (!task_parse_status(p_status, &status) ||
            !task_parse_priority(p_priority, &priority)) {
            goto fail;
        }
        if (!task_make(&task, (int)id_long, p_title, status, priority)) {
            goto fail;
        }
        if (!store_reserve(store, store->count + 1U)) {
            goto fail;
        }
        store->items[store->count] = task;
        store->count += 1U;
        if ((int)id_long > max_id) {
            max_id = (int)id_long;
        }
    }

    if (ferror(fp)) {
        goto fail;
    }

    if (fclose(fp) != 0) {
        fprintf(stderr, "Error: could not close '%s' after load.\n", path);
        store_free(store);
        store_init(store);
        return 0;
    }

    store->next_id = max_id + 1;
    return 1;

fail:
    fprintf(stderr, "Error: invalid or incomplete task file '%s'.\n", path);
    fclose(fp);
    store_free(store);
    store_init(store);
    return 0;
}
