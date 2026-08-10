import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownReader } from "./MarkdownReader";
import { renderWithRouter } from "../test-utils";

describe("MarkdownReader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders GFM tables and task lists", () => {
    render(
      <MarkdownReader
        content={`# Arrays

| Topic | Detail |
| --- | --- |
| Goal | Work with arrays |

- [ ] Review indexing
- [x] Practice traversal
`}
      />,
    );

    expect(screen.getByRole("heading", { name: "Arrays" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Review indexing")).toBeInTheDocument();
    expect(screen.getByText("Practice traversal")).toBeInTheDocument();
  });

  it("resolves repository lesson links into application routes", () => {
    renderWithRouter(<MarkdownReader content="Next: [Pointers](../Pointers/)" />);

    const link = screen.getByRole("link", { name: "Pointers" });
    expect(link).toHaveAttribute("href", "/lessons/pointers");
  });

  it("keeps external links external with rel protection", () => {
    render(
      <MarkdownReader content="Docs: [Example](https://example.com/docs)" />,
    );

    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
