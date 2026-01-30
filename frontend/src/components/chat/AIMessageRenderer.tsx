'use client';

import React from 'react';

interface AIMessageRendererProps {
    content: string;
}

/**
 * Calm, minimal AI message renderer
 * Acts as a guide that hands off to university cards for decisions
 * NO TRUNCATION - all text renders fully
 */
export function AIMessageRenderer({ content }: AIMessageRendererProps) {
    const { contextLine, insights, handoff } = parseForHandoff(content);

    return (
        <div className="ai-guide-message max-w-md text-sm text-gray-600 dark:text-slate-400 space-y-2">
            {/* Context line - stage awareness */}
            {contextLine && (
                <p className="leading-relaxed">{contextLine}</p>
            )}

            {/* High-level insights (max 2 bullets) */}
            {insights.length > 0 && (
                <ul className="space-y-1">
                    {insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{insight}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Handoff to cards */}
            {handoff && (
                <p className="text-gray-500 dark:text-slate-500 text-xs italic mt-2">
                    {handoff}
                </p>
            )}
        </div>
    );
}

/**
 * Parse AI content into minimal handoff format
 * NO TRUNCATION - full sentences always
 */
function parseForHandoff(content: string): {
    contextLine: string;
    insights: string[];
    handoff: string
} {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    let contextLine = '';
    const insights: string[] = [];
    let handoff = '';

    for (const line of lines) {
        const lower = line.toLowerCase();
        const cleaned = line.replace(/^[-•*#]+\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');

        // Skip very short lines
        if (cleaned.length < 10) continue;

        // Detect handoff lines (point to cards)
        if (lower.includes('review') || lower.includes('below') ||
            lower.includes('cards') || lower.includes('options') ||
            lower.includes('compare') || lower.includes('take a look')) {
            if (!handoff) handoff = cleaned; // No truncation
            continue;
        }

        // Detect context (stage, profile)
        if (lower.includes('discovery') || lower.includes('stage') ||
            lower.includes('profile') || lower.includes('based on') ||
            lower.includes("you're") || lower.includes('your ')) {
            if (!contextLine) {
                contextLine = cleaned; // No truncation
            }
            continue;
        }

        // Collect insights (max 2, full sentences)
        if (insights.length < 2 && cleaned.length > 15) {
            insights.push(cleaned); // No truncation
        }
    }

    // Fallback if nothing parsed - show full content
    if (!contextLine && !handoff && insights.length === 0) {
        contextLine = lines[0] || content; // Show full first line or content
        handoff = "Review the recommendations below.";
    }

    // Default handoff
    if (!handoff) {
        handoff = "Review the cards below to compare your options.";
    }

    return { contextLine, insights, handoff };
}

export default AIMessageRenderer;
