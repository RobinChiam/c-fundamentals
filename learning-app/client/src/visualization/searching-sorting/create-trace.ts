import { createBinarySearchTrace } from "./binary-search";
import { createBubbleSortTrace } from "./bubble-sort";
import { createInsertionSortTrace } from "./insertion-sort";
import { createLinearSearchTrace } from "./linear-search";
import type {
  SearchSortAlgorithmId,
  SearchSortTrace,
  SortOrder,
} from "./trace-types";

export function createSearchSortTrace(
  algorithmId: SearchSortAlgorithmId,
  values: number[],
  options: { target: number; sortOrder: SortOrder },
): SearchSortTrace {
  switch (algorithmId) {
    case "linear-search":
      return createLinearSearchTrace(values, options.target);
    case "binary-search":
      return createBinarySearchTrace(values, options.target);
    case "bubble-sort":
      return createBubbleSortTrace(values, options.sortOrder);
    case "insertion-sort":
      return createInsertionSortTrace(values, options.sortOrder);
    default: {
      const exhaustive: never = algorithmId;
      throw new Error(`Unknown algorithm: ${exhaustive}`);
    }
  }
}
