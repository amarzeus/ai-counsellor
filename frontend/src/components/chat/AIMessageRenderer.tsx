'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIMessageRendererProps {
    content: string;
}

/**
 * Custom renderer for AI Counsellor messages.
 * Applies structured formatting with visual hierarchy.
 */
export function AIMessageRenderer({ content }: AIMessageRendererProps) {
    // Process content to highlight entities
    const processedContent = highlightEntities(content);

    return (
        <div className="ai-message-content max-w-2xl">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom heading styles - section headers
                    h1: ({ children }) => (
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-4 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 mt-5 first:mt-0 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 mt-4">
                            {children}
                        </h3>
                    ),
                    // Paragraphs with proper spacing
                    p: ({ children }) => (
                        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-3 last:mb-0">
                            {children}
                        </p>
                    ),
                    // Styled lists
                    ul: ({ children }) => (
                        <ul className="space-y-2 mb-4 ml-1">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="space-y-2 mb-4 ml-1 list-decimal list-inside">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-sm text-gray-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                            <span className="flex-1">{children}</span>
                        </li>
                    ),
                    // Bold text (used for university names, emphasis)
                    strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white">
                            {children}
                        </strong>
                    ),
                    // Inline code for numbers, stats
                    code: ({ children }) => (
                        <code className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                            {children}
                        </code>
                    ),
                    // Blockquotes for notes/warnings
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-3 border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 my-3 rounded-r-lg">
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                {children}
                            </div>
                        </blockquote>
                    ),
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}

/**
 * Highlight important entities in the content:
 * - University names -> wrapped in **bold**
 * - Categories (DREAM/TARGET/SAFE) -> already styled via CSS
 * - Numbers (GPA, budget) -> wrapped in `code`
 */
function highlightEntities(content: string): string {
    let processed = content;

    // Highlight budget numbers (e.g., $45,000, $50000)
    processed = processed.replace(
        /\$[\d,]+(?:\/year)?/g,
        (match) => `\`${match}\``
    );

    // Highlight GPA values (e.g., 3.4, 3.8)
    processed = processed.replace(
        /\bGPA\s+(?:of\s+)?(\d\.\d+)/gi,
        (match, gpa) => `GPA of \`${gpa}\``
    );

    // Highlight percentages
    processed = processed.replace(
        /\b(\d+(?:\.\d+)?%)/g,
        (match) => `\`${match}\``
    );

    return processed;
}

/**
 * Category Badge Component
 */
export function CategoryBadge({ category }: { category: 'DREAM' | 'TARGET' | 'SAFE' }) {
    const styles = {
        DREAM: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        TARGET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        SAFE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[category]}`}>
            {category}
        </span>
    );
}

export default AIMessageRenderer;
