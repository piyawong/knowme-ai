/**
 * Markdown message renderer component.
 * 
 * Renders AI responses with beautiful markdown formatting including:
 * - Code syntax highlighting
 * - Tables, lists, and blockquotes
 * - Headers and emphasis
 * - Links and images
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check } from "lucide-react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ReactMarkdown
      className={`markdown-content prose prose-slate dark:prose-invert max-w-none ${className}`}
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeHighlight, rehypeRaw]}
      components={{
        // Custom code block rendering with copy button
        pre: ({ children, ...props }) => {
          const codeElement = React.Children.toArray(children)[0] as React.ReactElement;
          const codeContent = codeElement?.props?.children?.[0] as string;
          
          return (
            <div className="relative group my-4">
              <pre className="!bg-slate-900 dark:!bg-slate-950 rounded-lg overflow-x-auto p-4 shadow-lg border border-slate-700" {...props}>
                {children}
              </pre>
              {codeContent && (
                <button
                  onClick={() => handleCopyCode(codeContent)}
                  className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy code"
                >
                  {copiedCode === codeContent ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        },
        // Enhanced code inline styling
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={`${className} text-sm`} {...props}>
              {children}
            </code>
          );
        },
        // Beautiful blockquotes
        blockquote: ({ children, ...props }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground bg-muted/30 py-2 pr-4 rounded-r-md" {...props}>
            {children}
          </blockquote>
        ),
        // Enhanced tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-slate-100 dark:bg-slate-800" {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }) => (
          <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left font-semibold" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-slate-300 dark:border-slate-700 px-4 py-2" {...props}>
            {children}
          </td>
        ),
        // Headers with better spacing
        h1: ({ children, ...props }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props}>
            {children}
          </h3>
        ),
        // Lists with better spacing
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside space-y-1 my-3 ml-4" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside space-y-1 my-3 ml-4" {...props}>
            {children}
          </ol>
        ),
        // Enhanced links
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 transition-colors"
            {...props}
          >
            {children}
          </a>
        ),
        // Horizontal rules
        hr: ({ ...props }) => (
          <hr className="my-6 border-t border-slate-300 dark:border-slate-700" {...props} />
        ),
        // Paragraphs with proper spacing
        p: ({ children, ...props }) => (
          <p className="my-3 leading-relaxed" {...props}>
            {children}
          </p>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}