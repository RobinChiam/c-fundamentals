# Compile-smoke build for the C Fundamentals curriculum.
# Binaries are written to build/ so lesson folders stay clean.
#
# Lesson folder names contain spaces; paths are escaped in recipes.

CC = gcc
CFLAGS = -std=c17 -Wall -Wextra -Wpedantic
LDFLAGS_MATH = -lm

BUILD = build

PRIMARY = \
	$(BUILD)/basic-io-main \
	$(BUILD)/drawing-shapes \
	$(BUILD)/variables \
	$(BUILD)/operators \
	$(BUILD)/conditions \
	$(BUILD)/loops \
	$(BUILD)/functions \
	$(BUILD)/arrays \
	$(BUILD)/strings \
	$(BUILD)/pointers \
	$(BUILD)/structures \
	$(BUILD)/files \
	$(BUILD)/dynamic-memory \
	$(BUILD)/geometry \
	$(BUILD)/search-sort \
	$(BUILD)/task-tracker

SOLUTIONS = \
	$(BUILD)/basic-io-solution \
	$(BUILD)/drawing-shapes-solution \
	$(BUILD)/variables-solution \
	$(BUILD)/operators-solution \
	$(BUILD)/conditions-solution \
	$(BUILD)/loops-solution \
	$(BUILD)/functions-solution \
	$(BUILD)/arrays-solution \
	$(BUILD)/strings-solution \
	$(BUILD)/pointers-solution \
	$(BUILD)/structures-solution \
	$(BUILD)/files-solution \
	$(BUILD)/dynamic-memory-solution \
	$(BUILD)/geometry-solution \
	$(BUILD)/search-sort-solution \
	$(BUILD)/task-tracker-solution

.PHONY: all solutions clean

all: $(PRIMARY)

solutions: $(SOLUTIONS)

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/basic-io-main: | $(BUILD)
	$(CC) $(CFLAGS) Basic\ IO/main.c -o $@

$(BUILD)/basic-io-solution: | $(BUILD)
	$(CC) $(CFLAGS) Basic\ IO/solution.c -o $@

$(BUILD)/drawing-shapes: | $(BUILD)
	$(CC) $(CFLAGS) Drawing\ Shapes/shapes.c -o $@

$(BUILD)/drawing-shapes-solution: | $(BUILD)
	$(CC) $(CFLAGS) Drawing\ Shapes/solution.c -o $@

$(BUILD)/variables: | $(BUILD)
	$(CC) $(CFLAGS) Variables\ and\ Data\ Types/variables.c -o $@

$(BUILD)/variables-solution: | $(BUILD)
	$(CC) $(CFLAGS) Variables\ and\ Data\ Types/solution.c -o $@

$(BUILD)/operators: | $(BUILD)
	$(CC) $(CFLAGS) Operators\ and\ Expressions/operators.c -o $@

$(BUILD)/operators-solution: | $(BUILD)
	$(CC) $(CFLAGS) Operators\ and\ Expressions/solution.c -o $@

$(BUILD)/conditions: | $(BUILD)
	$(CC) $(CFLAGS) Conditional\ Statements/conditions.c -o $@

$(BUILD)/conditions-solution: | $(BUILD)
	$(CC) $(CFLAGS) Conditional\ Statements/solution.c -o $@

$(BUILD)/loops: | $(BUILD)
	$(CC) $(CFLAGS) Loops\ and\ Input\ Validation/loops.c -o $@

$(BUILD)/loops-solution: | $(BUILD)
	$(CC) $(CFLAGS) Loops\ and\ Input\ Validation/solution.c -o $@

$(BUILD)/functions: | $(BUILD)
	$(CC) $(CFLAGS) Functions\ and\ Scope/functions.c -o $@

$(BUILD)/functions-solution: | $(BUILD)
	$(CC) $(CFLAGS) Functions\ and\ Scope/solution.c -o $@

$(BUILD)/arrays: | $(BUILD)
	$(CC) $(CFLAGS) Arrays/arrays.c -o $@

$(BUILD)/arrays-solution: | $(BUILD)
	$(CC) $(CFLAGS) Arrays/solution.c -o $@

$(BUILD)/strings: | $(BUILD)
	$(CC) $(CFLAGS) Strings\ and\ Character\ Handling/strings.c -o $@

$(BUILD)/strings-solution: | $(BUILD)
	$(CC) $(CFLAGS) Strings\ and\ Character\ Handling/solution.c -o $@

$(BUILD)/pointers: | $(BUILD)
	$(CC) $(CFLAGS) Pointers/pointers.c -o $@

$(BUILD)/pointers-solution: | $(BUILD)
	$(CC) $(CFLAGS) Pointers/solution.c -o $@

$(BUILD)/structures: | $(BUILD)
	$(CC) $(CFLAGS) Structures\ and\ Enumerations/structures.c -o $@

$(BUILD)/structures-solution: | $(BUILD)
	$(CC) $(CFLAGS) Structures\ and\ Enumerations/solution.c -o $@

$(BUILD)/files: | $(BUILD)
	$(CC) $(CFLAGS) File\ Input\ and\ Output/files.c -o $@

$(BUILD)/files-solution: | $(BUILD)
	$(CC) $(CFLAGS) File\ Input\ and\ Output/solution.c -o $@

$(BUILD)/dynamic-memory: | $(BUILD)
	$(CC) $(CFLAGS) Dynamic\ Memory\ Allocation/dynamic_memory.c -o $@

$(BUILD)/dynamic-memory-solution: | $(BUILD)
	$(CC) $(CFLAGS) Dynamic\ Memory\ Allocation/solution.c -o $@

$(BUILD)/geometry: | $(BUILD)
	$(CC) $(CFLAGS) Header\ Files\ and\ Multiple\ Source\ Files/main.c \
		Header\ Files\ and\ Multiple\ Source\ Files/geometry.c -o $@ $(LDFLAGS_MATH)

$(BUILD)/geometry-solution: | $(BUILD)
	$(CC) $(CFLAGS) Header\ Files\ and\ Multiple\ Source\ Files/solution.c \
		Header\ Files\ and\ Multiple\ Source\ Files/geometry.c -o $@ $(LDFLAGS_MATH)

$(BUILD)/search-sort: | $(BUILD)
	$(CC) $(CFLAGS) Searching\ and\ Sorting/search_sort.c -o $@

$(BUILD)/search-sort-solution: | $(BUILD)
	$(CC) $(CFLAGS) Searching\ and\ Sorting/solution.c -o $@

$(BUILD)/task-tracker: | $(BUILD)
	$(CC) $(CFLAGS) Intermediate\ Console\ Project/main.c \
		Intermediate\ Console\ Project/task.c \
		Intermediate\ Console\ Project/store.c \
		Intermediate\ Console\ Project/util.c -o $@

$(BUILD)/task-tracker-solution: | $(BUILD)
	$(CC) $(CFLAGS) Intermediate\ Console\ Project/solution.c \
		Intermediate\ Console\ Project/task.c \
		Intermediate\ Console\ Project/store.c \
		Intermediate\ Console\ Project/util.c -o $@

clean:
	rm -rf $(BUILD)
