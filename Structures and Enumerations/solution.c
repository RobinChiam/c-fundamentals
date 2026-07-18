/*
 * Lesson 9 — Structures (reference solution for README exercises)
 *
 * Product records with an enum category: add, list, find by sku.
 *
 * Compile:
 *   gcc -std=c17 -Wall -Wextra -Wpedantic solution.c -o solution.exe
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PRODUCTS 16
#define NAME_SIZE 48
#define LINE_SIZE 128

enum ProductCategory {
    CAT_FOOD = 0,
    CAT_TOOLS = 1,
    CAT_OTHER = 2
};

struct Product {
    int sku;
    char name[NAME_SIZE];
    double price;
    enum ProductCategory category;
};

static void pause_at_exit(void)
{
    /* Platform convenience for Windows consoles — not core C logic. */
    printf("Press Enter to exit...");
    fflush(stdout);
    (void)getchar();
}

static void strip_trailing_newline(char *text)
{
    size_t len = 0;

    if (text == NULL) {
        return;
    }
    len = strlen(text);
    if (len > 0U && text[len - 1U] == '\n') {
        text[len - 1U] = '\0';
    }
}

static int read_line(const char *prompt, char *buf, size_t buf_size)
{
    printf("%s", prompt);
    fflush(stdout);
    if (buf == NULL || buf_size == 0U) {
        return 0;
    }
    if (fgets(buf, (int)buf_size, stdin) == NULL) {
        return 0;
    }
    strip_trailing_newline(buf);
    return 1;
}

static int read_int(const char *prompt, int *out_value)
{
    char line[LINE_SIZE];
    char *end = NULL;
    long parsed = 0;

    if (out_value == NULL || !read_line(prompt, line, sizeof line)) {
        return 0;
    }
    parsed = strtol(line, &end, 10);
    if (end == line) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    *out_value = (int)parsed;
    return 1;
}

static int read_double(const char *prompt, double *out_value)
{
    char line[LINE_SIZE];
    char *end = NULL;
    double parsed = 0.0;

    if (out_value == NULL || !read_line(prompt, line, sizeof line)) {
        return 0;
    }
    parsed = strtod(line, &end);
    if (end == line) {
        return 0;
    }
    while (*end == ' ' || *end == '\t') {
        end++;
    }
    if (*end != '\0') {
        return 0;
    }
    *out_value = parsed;
    return 1;
}

static const char *category_name(enum ProductCategory category)
{
    switch (category) {
    case CAT_FOOD:
        return "FOOD";
    case CAT_TOOLS:
        return "TOOLS";
    case CAT_OTHER:
        return "OTHER";
    default:
        return "UNKNOWN";
    }
}

/* Exercise 1 helper: print one product via pointer. */
static void print_product(const struct Product *product)
{
    if (product == NULL) {
        return;
    }
    printf("sku=%d name=\"%s\" price=%.2f category=%s\n",
           product->sku, product->name, product->price,
           category_name(product->category));
}

/* Exercise 2: find by sku; return index or -1. */
static int find_product(const struct Product products[], int count, int sku)
{
    int i = 0;

    for (i = 0; i < count; i++) {
        if (products[i].sku == sku) {
            return i;
        }
    }
    return -1;
}

/* Exercise 3: average price of products in a category (0 if none). */
static double average_price_for_category(const struct Product products[],
                                         int count,
                                         enum ProductCategory category)
{
    int i = 0;
    int matched = 0;
    double total = 0.0;

    for (i = 0; i < count; i++) {
        if (products[i].category == category) {
            total += products[i].price;
            matched++;
        }
    }
    if (matched == 0) {
        return 0.0;
    }
    return total / (double)matched;
}

static int add_product(struct Product products[], int *count, int capacity)
{
    struct Product item;
    int cat = 0;

    if (products == NULL || count == NULL || *count >= capacity) {
        printf("Inventory full.\n");
        return 0;
    }

    item = (struct Product){0, "", 0.0, CAT_OTHER};

    while (!read_int("SKU: ", &item.sku) || item.sku <= 0) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Positive SKU required.\n");
    }
    if (find_product(products, *count, item.sku) >= 0) {
        printf("Duplicate SKU.\n");
        return 0;
    }
    while (!read_line("Name: ", item.name, sizeof item.name) ||
           item.name[0] == '\0') {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Name required.\n");
    }
    while (!read_double("Price: ", &item.price) || item.price < 0.0) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Non-negative price required.\n");
    }
    printf("Category 0=FOOD 1=TOOLS 2=OTHER\n");
    while (!read_int("Category: ", &cat) || cat < 0 || cat > 2) {
        if (feof(stdin)) {
            fprintf(stderr, "End of input.\n");
            break;
        }
        printf("Enter 0..2.\n");
    }
    item.category = (enum ProductCategory)cat;

    products[*count] = item;
    (*count)++;
    return 1;
}

int main(void)
{
    struct Product inventory[MAX_PRODUCTS];
    int count = 0;
    int choice = 0;
    int running = 1;
    int i = 0;

    for (i = 0; i < MAX_PRODUCTS; i++) {
        inventory[i] = (struct Product){0, "", 0.0, CAT_OTHER};
    }

    inventory[0] = (struct Product){
        .sku = 501,
        .name = "Hammer",
        .price = 12.50,
        .category = CAT_TOOLS
    };
    inventory[1] = (struct Product){
        .sku = 220,
        .name = "Oats",
        .price = 3.25,
        .category = CAT_FOOD
    };
    count = 2;

    printf("=== Lesson 9 solution: product records ===\n");

    while (running) {
        printf("1) Add  2) List  3) Find  4) Avg FOOD price  5) Quit\n");
        if (!read_int("Choice: ", &choice)) {
            printf("Invalid.\n");
            continue;
        }
        switch (choice) {
        case 1:
            (void)add_product(inventory, &count, MAX_PRODUCTS);
            break;
        case 2:
            for (i = 0; i < count; i++) {
                print_product(&inventory[i]);
            }
            break;
        case 3: {
            int sku = 0;
            int index = -1;

            while (!read_int("SKU: ", &sku)) {
                if (feof(stdin)) {
                    fprintf(stderr, "End of input.\n");
                    break;
                }
                printf("Enter integer SKU.\n");
            }
            index = find_product(inventory, count, sku);
            if (index < 0) {
                printf("Not found.\n");
            } else {
                print_product(&inventory[index]);
            }
            break;
        }
        case 4:
            printf("Average FOOD price: %.2f\n",
                   average_price_for_category(inventory, count, CAT_FOOD));
            break;
        case 5:
            running = 0;
            break;
        default:
            printf("Choose 1-5.\n");
            break;
        }
    }

    pause_at_exit();
    return 0;
}
