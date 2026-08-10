/**
 * Converts a curriculum lesson directory name to the stable lesson ID
 * used in the Part 2 manifest and application routes.
 */
export function directoryNameToLessonId(directoryName: string): string {
  return decodeURIComponent(directoryName)
    .trim()
    .replace(/\/+$/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export type ResolvedMarkdownLink =
  | { type: "internal"; to: string }
  | { type: "external" }
  | { type: "unresolved" };

/**
 * Resolves repository-relative Markdown links from lesson READMEs into
 * application routes. External links are left unchanged.
 */
export function resolveMarkdownHref(href: string): ResolvedMarkdownLink {
  if (/^https?:\/\//i.test(href)) {
    return { type: "external" };
  }

  const withoutFragment = href.split("#")[0] ?? href;

  if (/^\.\.\/README\.md\/?$/i.test(withoutFragment)) {
    return { type: "internal", to: "/" };
  }

  const lessonDirectoryMatch = withoutFragment.match(/^\.\.\/([^/]+)\/?$/);
  if (lessonDirectoryMatch) {
    const lessonId = directoryNameToLessonId(lessonDirectoryMatch[1] ?? "");
    return { type: "internal", to: `/lessons/${lessonId}` };
  }

  return { type: "unresolved" };
}
