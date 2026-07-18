/*
 * store.h — growable task list with search/sort and text-file persistence.
 */

#ifndef STORE_H
#define STORE_H

#include "task.h"

typedef struct {
    Task *items;     /* heap array; NULL when empty */
    size_t count;
    size_t capacity;
    int next_id;     /* next id to assign on add */
} TaskStore;

void store_init(TaskStore *store);
void store_free(TaskStore *store);

/* Add a task; assigns id from next_id. Returns 1 on success. */
int store_add(TaskStore *store, const char *title, TaskStatus status,
              TaskPriority priority);

/* Remove by id. Returns 1 if removed, 0 if not found / error. */
int store_remove_by_id(TaskStore *store, int id);

/* Linear search by id. Returns pointer into store or NULL. */
Task *store_find_by_id(TaskStore *store, int id);

/* Linear search: first task whose title contains needle (case-sensitive). */
Task *store_find_title_contains(TaskStore *store, const char *needle);

/* Sort in place by priority (high first), then id. */
void store_sort_by_priority(TaskStore *store);

void store_print_all(const TaskStore *store);

/*
 * Save/load a simple text format, one task per line:
 *   id|status|priority|title
 * On load failure after partial reads, the store is freed/reset.
 */
int store_save(const TaskStore *store, const char *path);
int store_load(TaskStore *store, const char *path);

#endif /* STORE_H */
