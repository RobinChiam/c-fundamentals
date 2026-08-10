import { describe, expect, it } from "vitest";
import {
  directoryNameToLessonId,
  resolveMarkdownHref,
} from "./markdown-links";

describe("markdown-links", () => {
  it("maps ../Pointers/ to /lessons/pointers", () => {
    expect(resolveMarkdownHref("../Pointers/")).toEqual({
      type: "internal",
      to: "/lessons/pointers",
    });
  });

  it("normalizes percent-encoded lesson directory paths", () => {
    expect(resolveMarkdownHref("../Strings%20and%20Character%20Handling/")).toEqual(
      {
        type: "internal",
        to: "/lessons/strings-and-character-handling",
      },
    );
    expect(
      directoryNameToLessonId("Header%20Files%20and%20Multiple%20Source%20Files"),
    ).toBe("header-files-and-multiple-source-files");
  });

  it("maps ../README.md to /", () => {
    expect(resolveMarkdownHref("../README.md")).toEqual({
      type: "internal",
      to: "/",
    });
  });

  it("keeps external HTTPS links external", () => {
    expect(resolveMarkdownHref("https://example.com/docs")).toEqual({
      type: "external",
    });
  });
});
