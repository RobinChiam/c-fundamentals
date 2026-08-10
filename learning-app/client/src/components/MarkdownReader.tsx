import type { Components } from "react-markdown";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import remarkGfm from "remark-gfm";
import { resolveMarkdownHref } from "../routing/markdown-links";

interface MarkdownReaderProps {
  content: string;
  demoteHeadings?: boolean;
}

function createHeadingComponent(
  level: 1 | 2 | 3,
  demoteHeadings: boolean,
) {
  const effectiveLevel = demoteHeadings ? Math.min(level + 1, 3) : level;

  if (effectiveLevel === 1) {
    return ({ children }: { children?: ReactNode }) => (
      <h1 className="mb-4 mt-8 text-3xl font-bold text-slate-900 first:mt-0">
        {children}
      </h1>
    );
  }

  if (effectiveLevel === 2) {
    return ({ children }: { children?: ReactNode }) => (
      <h2 className="mb-3 mt-8 border-b border-slate-200 pb-2 text-2xl font-semibold text-slate-900">
        {children}
      </h2>
    );
  }

  return ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-2 mt-6 text-xl font-semibold text-slate-900">{children}</h3>
  );
}

function createMarkdownComponents(demoteHeadings: boolean): Components {
  return {
  a: ({ href, children }) => {
    if (!href) {
      return <span>{children}</span>;
    }

    const resolved = resolveMarkdownHref(href);

    if (resolved.type === "internal") {
      return (
        <Link
          to={resolved.to}
          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
        >
          {children}
        </Link>
      );
    }

    if (resolved.type === "external") {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
        >
          {children}
        </a>
      );
    }

    return (
      <a
        href={href}
        className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
      >
        {children}
      </a>
    );
  },
  h1: createHeadingComponent(1, demoteHeadings),
  h2: createHeadingComponent(2, demoteHeadings),
  h3: createHeadingComponent(3, demoteHeadings),
  p: ({ children }) => <p className="mb-4 leading-7 text-slate-800">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-800">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-800">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-4 border-slate-300 pl-4 italic text-slate-700">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-slate-200 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-3 py-2 text-slate-800">{children}</td>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);

    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-md bg-slate-900 px-4 py-3 text-sm text-slate-100">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-900">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-md bg-slate-900 p-0">{children}</pre>
  ),
  };
}

export function MarkdownReader({
  content,
  demoteHeadings = false,
}: MarkdownReaderProps) {
  return (
    <article className="prose-readme max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={createMarkdownComponents(demoteHeadings)}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
