import type { LabDefinition } from "./lab-types.js";

const HARNESS_HEADER = `#include <stdio.h>
#define PROTOCOL "{{TOKEN}}"

#include "submission.c"

static void emit_result(const char *test_id, int passed)
{
    printf("%s TEST %s %s\\n", PROTOCOL, test_id, passed ? "PASS" : "FAIL");
}

`;

function harness(token: string, body: string): string {
  return `${HARNESS_HEADER.replace("{{TOKEN}}", token)}${body}`;
}

const LEAP_YEAR_STARTER = `/* Return non-zero if year is a leap year, otherwise 0. */
int is_leap_year(int year)
{
    /* TODO: implement leap-year rules. */
    (void)year;
    return 0;
}
`;

const IS_PRIME_STARTER = `/* Return 1 if n is prime, otherwise 0. */
int is_prime(int n)
{
    /* TODO: implement primality test. */
    (void)n;
    return 0;
}
`;

const COUNT_ABOVE_STARTER = `/* Count values strictly greater than threshold. */
int count_above(const int values[], int length, int threshold)
{
    /* TODO: implement the count. */
    (void)values;
    (void)length;
    (void)threshold;
    return 0;
}
`;

const ABSOLUTE_STARTER = `/* Store the absolute value of *value in *out. */
void absolute_via_pointer(const int *value, int *out)
{
    /* TODO: read through value and write through out. */
    (void)value;
    (void)out;
}
`;

export const LAB_REGISTRY: LabDefinition[] = [
  {
    id: "conditional-leap-year",
    lessonId: "conditional-statements",
    exerciseNumber: 1,
    title: "Leap Year Check",
    revision: 1,
    prompt:
      "Implement is_leap_year(int year) that returns non-zero when the year is a leap year. A leap year is divisible by 4, except century years must also be divisible by 400.",
    concepts: ["if / else if / else", "modulo", "boolean conditions"],
    starterFiles: [
      {
        id: "submission",
        name: "submission.c",
        content: LEAP_YEAR_STARTER,
      },
    ],
    publicTests: [
      { id: "leap-ordinary-leap", title: "Handles ordinary leap year", visibility: "public" },
      { id: "leap-ordinary-non-leap", title: "Handles ordinary non-leap year", visibility: "public" },
    ],
    hiddenTests: [
      { id: "leap-century", title: "Handles century exception", visibility: "hidden" },
      { id: "leap-div-400", title: "Handles divisible-by-400 rule", visibility: "hidden" },
      { id: "leap-additional", title: "Handles additional edge cases", visibility: "hidden" },
    ],
    hints: [
      {
        index: 0,
        content:
          "A leap year is usually divisible by 4. Think about what makes a year special compared with ordinary years.",
      },
      {
        index: 1,
        content:
          "Century years (like 1900) are divisible by 4 but are not leap years unless they are also divisible by 400.",
      },
      {
        index: 2,
        content:
          "Check the 400 rule first, then the 100 rule, then the 4 rule. Return non-zero only when the year qualifies.",
      },
      {
        index: 3,
        content:
          "if (year % 400 == 0) return 1; else if (year % 100 == 0) return 0; else if (year % 4 == 0) return 1; else return 0;",
      },
    ],
    evaluation: {
      submissionFileId: "submission",
      harnessFileName: "__lab_tests.c",
      buildHarness: (token) =>
        harness(
          token,
          `int main(void)
{
    emit_result("leap-ordinary-leap", is_leap_year(2024));
    emit_result("leap-ordinary-non-leap", !is_leap_year(2023));
    emit_result("leap-century", !is_leap_year(1900));
    emit_result("leap-div-400", is_leap_year(2000));
    emit_result("leap-additional", !is_leap_year(2100));
    return 0;
}
`,
        ),
    },
    solutionFileId: "solution",
  },
  {
    id: "functions-is-prime",
    lessonId: "functions-and-scope",
    exerciseNumber: 1,
    title: "Primality Test",
    revision: 1,
    prompt:
      "Implement is_prime(int n) returning 1 when n is prime and 0 otherwise. Numbers less than 2 are not prime.",
    concepts: ["functions", "return values", "loops", "decomposition"],
    starterFiles: [
      {
        id: "submission",
        name: "submission.c",
        content: IS_PRIME_STARTER,
      },
    ],
    publicTests: [
      { id: "prime-below-two", title: "Values below 2 are not prime", visibility: "public" },
      { id: "prime-two", title: "2 is prime", visibility: "public" },
    ],
    hiddenTests: [
      { id: "prime-small", title: "Recognizes a small prime", visibility: "hidden" },
      { id: "composite-small", title: "Recognizes a small composite", visibility: "hidden" },
      { id: "prime-additional", title: "Handles additional prime case", visibility: "hidden" },
      { id: "composite-additional", title: "Handles additional composite case", visibility: "hidden" },
    ],
    hints: [
      {
        index: 0,
        content:
          "Prime numbers have exactly two positive divisors: 1 and themselves. Handle small values like 0, 1, and 2 separately.",
      },
      {
        index: 1,
        content:
          "Test divisibility with a loop. Even numbers greater than 2 can be rejected quickly before deeper testing.",
      },
      {
        index: 2,
        content:
          "Try odd divisors starting at 3. Stop when divisor * divisor exceeds n or when you find a divisor.",
      },
      {
        index: 3,
        content:
          "if (n <= 1) return 0; if (n == 2) return 1; if (n % 2 == 0) return 0; for (d = 3; d * d <= n; d += 2) if (n % d == 0) return 0; return 1;",
      },
    ],
    evaluation: {
      submissionFileId: "submission",
      harnessFileName: "__lab_tests.c",
      buildHarness: (token) =>
        harness(
          token,
          `int main(void)
{
    emit_result("prime-below-two", !is_prime(1) && !is_prime(0));
    emit_result("prime-two", is_prime(2));
    emit_result("prime-small", is_prime(7));
    emit_result("composite-small", !is_prime(9));
    emit_result("prime-additional", is_prime(29));
    emit_result("composite-additional", !is_prime(30));
    return 0;
}
`,
        ),
    },
    solutionFileId: "solution",
  },
  {
    id: "arrays-count-above",
    lessonId: "arrays",
    exerciseNumber: 2,
    title: "Count Above Threshold",
    revision: 1,
    prompt:
      "Implement count_above(values, length, threshold) to return how many elements are strictly greater than threshold. Values equal to threshold must not be counted.",
    concepts: ["array parameters", "loops", "strict comparisons"],
    starterFiles: [
      {
        id: "submission",
        name: "submission.c",
        content: COUNT_ABOVE_STARTER,
      },
    ],
    publicTests: [
      { id: "count-ordinary", title: "Handles ordinary values", visibility: "public" },
      { id: "count-none-above", title: "Handles no values above threshold", visibility: "public" },
    ],
    hiddenTests: [
      { id: "count-all-above", title: "Handles all values above threshold", visibility: "hidden" },
      { id: "count-equality-excluded", title: "Does not count equal values", visibility: "hidden" },
      { id: "count-negative", title: "Handles negative values", visibility: "hidden" },
      { id: "count-empty", title: "Handles length 0", visibility: "hidden" },
    ],
    hints: [
      {
        index: 0,
        content:
          "Walk the array from index 0 to length - 1 and decide whether each element should contribute to the count.",
      },
      {
        index: 1,
        content:
          "Only values strictly greater than threshold count. Equal values should be skipped.",
      },
      {
        index: 2,
        content:
          "Use a running total. For each index, compare values[i] > threshold and increment when true.",
      },
      {
        index: 3,
        content:
          "for (i = 0; i < length; i++) { if (values[i] > threshold) { found++; } } return found;",
      },
    ],
    evaluation: {
      submissionFileId: "submission",
      harnessFileName: "__lab_tests.c",
      buildHarness: (token) =>
        harness(
          token,
          `int main(void)
{
    const int ordinary[] = { 1, 5, 3, 8, 2 };
    const int all_above[] = { 10, 20, 30 };
    const int equal_mix[] = { 4, 4, 5, 4 };
    const int negatives[] = { -5, -1, 0, 2 };
    const int empty[] = { 0 };

    emit_result("count-ordinary", count_above(ordinary, 5, 3) == 2);
    emit_result("count-none-above", count_above(ordinary, 5, 8) == 0);
    emit_result("count-all-above", count_above(all_above, 3, 5) == 3);
    emit_result("count-equality-excluded", count_above(equal_mix, 4, 4) == 1);
    emit_result("count-negative", count_above(negatives, 4, -2) == 2);
    emit_result("count-empty", count_above(empty, 0, 1) == 0);
    return 0;
}
`,
        ),
    },
    solutionFileId: "solution",
  },
  {
    id: "pointers-absolute",
    lessonId: "pointers",
    exerciseNumber: 1,
    title: "Absolute via Pointer",
    revision: 1,
    prompt:
      "Implement absolute_via_pointer(value, out) to read the input through value and write the absolute result through out.",
    concepts: ["pointers", "dereference", "out-parameters"],
    starterFiles: [
      {
        id: "submission",
        name: "submission.c",
        content: ABSOLUTE_STARTER,
      },
    ],
    publicTests: [
      { id: "abs-positive", title: "Handles positive values", visibility: "public" },
      { id: "abs-negative", title: "Handles negative values", visibility: "public" },
      { id: "abs-zero", title: "Handles zero", visibility: "public" },
    ],
    hiddenTests: [
      { id: "abs-pointer-read-write", title: "Reads input and writes through out pointer", visibility: "hidden" },
    ],
    hints: [
      {
        index: 0,
        content:
          "The caller passes two pointers: one to read the input value and one to receive the result.",
      },
      {
        index: 1,
        content:
          "Absolute value means distance from zero. Negative inputs become positive; zero stays zero.",
      },
      {
        index: 2,
        content:
          "Read with *value. If the value is negative, store its negation in *out; otherwise store the value itself.",
      },
      {
        index: 3,
        content:
          "if (*value < 0) { *out = -(*value); } else { *out = *value; }",
      },
    ],
    evaluation: {
      submissionFileId: "submission",
      harnessFileName: "__lab_tests.c",
      buildHarness: (token) =>
        harness(
          token,
          `int main(void)
{
    int positive = 7;
    int negative = -7;
    int zero = 0;
    int out = 0;

    absolute_via_pointer(&positive, &out);
    emit_result("abs-positive", out == 7);

    absolute_via_pointer(&negative, &out);
    emit_result("abs-negative", out == 7);

    absolute_via_pointer(&zero, &out);
    emit_result("abs-zero", out == 0);

    out = 999;
    absolute_via_pointer(&negative, &out);
    emit_result("abs-pointer-read-write", out == 7);
    return 0;
}
`,
        ),
    },
    solutionFileId: "solution",
  },
];

export const LAB_REGISTRY_BY_ID = new Map(
  LAB_REGISTRY.map((lab) => [lab.id, lab]),
);

export const LAB_REGISTRY_BY_LESSON = LAB_REGISTRY.reduce<
  Map<string, LabDefinition[]>
>((map, lab) => {
  const existing = map.get(lab.lessonId) ?? [];
  existing.push(lab);
  map.set(lab.lessonId, existing);
  return map;
}, new Map());
