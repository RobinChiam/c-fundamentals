import { describe, expect, it } from "vitest";
import {
  detectIncludeGuard,
  extractIncludes,
  resolveProjectInclude,
} from "./source-analysis.js";

const GEOMETRY_MANIFEST = [
  { id: "primary", name: "main.c" },
  { id: "geometry", name: "geometry.c" },
  { id: "geometry-header", name: "geometry.h" },
];

const CAPSTONE_MANIFEST = [
  { id: "primary", name: "main.c" },
  { id: "task", name: "task.c" },
  { id: "task-header", name: "task.h" },
  { id: "store", name: "store.c" },
  { id: "store-header", name: "store.h" },
  { id: "util", name: "util.c" },
  { id: "util-header", name: "util.h" },
];

describe("source-analysis", () => {
  it("detects quoted project include", () => {
    const source = '#include "geometry.h"\n#include <stdio.h>\n';
    const result = extractIncludes(source);
    expect(result.projectIncludes).toEqual(["geometry.h"]);
  });

  it("ignores system includes for project graph facts", () => {
    const source = '#include <stdio.h>\n#include <stddef.h>\n';
    const result = extractIncludes(source);
    expect(result.projectIncludes).toEqual([]);
    expect(result.systemIncludes).toEqual(["stdio.h", "stddef.h"]);
  });

  it("resolves include to manifest file", () => {
    const resolved = resolveProjectInclude("geometry.h", GEOMETRY_MANIFEST);
    expect(resolved?.id).toBe("geometry-header");
  });

  it("does not resolve arbitrary external path", () => {
    expect(resolveProjectInclude("../secret.h", GEOMETRY_MANIFEST)).toBeNull();
    expect(resolveProjectInclude("/etc/passwd", GEOMETRY_MANIFEST)).toBeNull();
    expect(resolveProjectInclude("missing.h", GEOMETRY_MANIFEST)).toBeNull();
  });

  it("geometry include relationships are correct", () => {
    const mainSource = '#include "geometry.h"\n';
    const geometrySource = '#include "geometry.h"\n#include <math.h>\n';
    const mainIncludes = extractIncludes(mainSource).projectIncludes;
    const geometryIncludes = extractIncludes(geometrySource).projectIncludes;

    expect(mainIncludes).toEqual(["geometry.h"]);
    expect(geometryIncludes).toEqual(["geometry.h"]);
    expect(resolveProjectInclude(mainIncludes[0]!, GEOMETRY_MANIFEST)?.id).toBe(
      "geometry-header",
    );
  });

  it("capstone include relationships are correct", () => {
    const mainSource = '#include "store.h"\n#include "util.h"\n';
    const storeHeader = '#include "task.h"\n';
    const mainIncludes = extractIncludes(mainSource).projectIncludes;
    expect(mainIncludes).toEqual(["store.h", "util.h"]);
    expect(resolveProjectInclude("store.h", CAPSTONE_MANIFEST)?.id).toBe(
      "store-header",
    );
    expect(resolveProjectInclude("task.h", CAPSTONE_MANIFEST)?.id).toBe(
      "task-header",
    );
    expect(extractIncludes(storeHeader).projectIncludes).toEqual(["task.h"]);
  });

  it("detects geometry include guard", () => {
    const source = "#ifndef GEOMETRY_H\n#define GEOMETRY_H\n#endif\n";
    expect(detectIncludeGuard(source)).toBe("GEOMETRY_H");
  });

  it("detects task include guard", () => {
    const source = "#ifndef TASK_H\n#define TASK_H\n#endif\n";
    expect(detectIncludeGuard(source)).toBe("TASK_H");
  });

  it("detects store include guard", () => {
    const source = "#ifndef STORE_H\n#define STORE_H\n#endif\n";
    expect(detectIncludeGuard(source)).toBe("STORE_H");
  });

  it("detects util include guard", () => {
    const source = "#ifndef UTIL_H\n#define UTIL_H\n#endif\n";
    expect(detectIncludeGuard(source)).toBe("UTIL_H");
  });

  it("handles malformed/unresolved project include deliberately", () => {
    const source = '#include "unknown-local.h"\n';
    const includes = extractIncludes(source).projectIncludes;
    expect(includes).toEqual(["unknown-local.h"]);
    expect(resolveProjectInclude(includes[0]!, GEOMETRY_MANIFEST)).toBeNull();
  });
});
