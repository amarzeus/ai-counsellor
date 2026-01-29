'use client';

import React from 'react';

interface AIMessageRendererProps {
    content: string;
}

/**
 * Information-Design Focused AI Message Renderer
 * Renders AI responses as SEPARATE visual blocks, not one card
 */
export function AIMessageRenderer({ content }: AIMessageRendererProps) {
    const blocks = parseIntoBlocks(content);

    return (
        <div className="ai-blocks-container space-y-3 max-w-lg">
            {blocks.map((block, idx) => (
                <BlockRenderer key={idx} block={block} />
            ))}
        </div>
    );
}

interface Block {
    type: 'context' | 'insights' | 'recommendations' | 'next-step';
    items: string[];
}

/**
 * Render each block as a separate visual container
 */
function BlockRenderer({ block }: { block: Block }) {
    switch (block.type) {
        case 'context':
            return <ContextBlock items={block.items} />;
        case 'insights':
            return <InsightsBlock items={block.items} />;
        case 'recommendations':
            return <RecommendationsBlock items={block.items} />;
        case 'next-step':
            return <NextStepBlock items={block.items} />;
        default:
            return null;
    }
}

/**
 * CONTEXT BLOCK
 * Short, 1-2 lines, muted, stage awareness
 */
function ContextBlock({ items }: { items: string[] }) {
    const text = items.slice(0, 2).join(' ').substring(0, 150);

    return (
        <div className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            <HighlightedText text={text} />
        </div>
    );
}

/**
 * INSIGHTS BLOCK
 * Pure bullets, profile facts, minimal
 */
function InsightsBlock({ items }: { items: string[] }) {
    // Limit to 4 insights max
    const displayItems = items.slice(0, 4);

    return (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                Your Profile
            </div>
            <div className="flex flex-wrap gap-2">
                {displayItems.map((item, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-600"
                    >
                        <HighlightedText text={shortenToKeyFact(item)} />
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * RECOMMENDATIONS BLOCK
 * Visually dominant, each uni as a mini-card
 */
function RecommendationsBlock({ items }: { items: string[] }) {
    // Parse each item for university name and category
    const recommendations = items.slice(0, 4).map(parseRecommendation);

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Recommended
            </div>
            <div className="space-y-2">
                {recommendations.map((rec, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                {rec.name}
                            </div>
                            {rec.reason && (
                                <div className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                    {rec.reason}
                                </div>
                            )}
                        </div>
                        {rec.category && (
                            <CategoryBadge category={rec.category} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * NEXT STEP BLOCK
 * One clear action, visually lighter
 */
function NextStepBlock({ items }: { items: string[] }) {
    const action = items[0] || '';

    return (
        <div className="flex items-start gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <span className="text-blue-500 mt-0.5">→</span>
            <span className="text-xs text-gray-600 dark:text-slate-400">
                <HighlightedText text={shortenAction(action)} />
            </span>
        </div>
    );
}

/**
 * Category Badge
 */
function CategoryBadge({ category }: { category: string }) {
    const upper = category.toUpperCase();
    const styles: Record<string, string> = {
        'DREAM': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
        'TARGET': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        'SAFE': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${styles[upper] || styles['TARGET']}`}>
            {upper}
        </span>
    );
}

/**
 * Highlighted text with entities
 */
function HighlightedText({ text }: { text: string }) {
    // Highlight numbers
    const parts = text.split(/(\$[\d,]+(?:\/year)?|\d\.\d+\s*GPA|GPA\s*(?:of\s*)?\d\.\d+|\d+%)/gi);

    return (
        <>
            {parts.map((part, i) => {
                if (part.match(/\$|GPA|%/i)) {
                    return (
                        <span key={i} className="px-1 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-[11px] font-medium">
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

/**
 * Parse content into distinct blocks
 */
function parseIntoBlocks(content: string): Block[] {
    const blocks: Block[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    const contextItems: string[] = [];
    const insightItems: string[] = [];
    const recommendationItems: string[] = [];
    const nextStepItems: string[] = [];

    for (const line of lines) {
        const lower = line.toLowerCase();
        const cleaned = line.replace(/^[-•*#]+\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');

        // Skip empty or header-only lines
        if (cleaned.length < 3) continue;

        // Detect next step / action lines
        if (lower.includes('let me know') || lower.includes('would you like') ||
            lower.includes('shall i') || lower.includes('next step') ||
            lower.includes('ready to') || lower.includes('feel free')) {
            nextStepItems.push(cleaned);
            continue;
        }

        // Detect recommendations (universities mentioned)
        if (lower.includes('university') || lower.includes('mit') || lower.includes('stanford') ||
            lower.includes('oxford') || lower.includes('cambridge') || lower.includes('toronto') ||
            lower.includes('dream') || lower.includes('target') || lower.includes('safe') ||
            lower.includes('recommend') && (lower.includes(':') || line.startsWith('-'))) {
            recommendationItems.push(cleaned);
            continue;
        }

        // Detect insight facts (profile data)
        if (lower.includes('gpa') || lower.includes('budget') || lower.includes('$') ||
            lower.includes('stage') || lower.includes('profile') || lower.includes('score') ||
            lower.includes('ielts') || lower.includes('toefl') || lower.includes('gre')) {
            insightItems.push(cleaned);
            continue;
        }

        // Everything else is context (limit to first 2)
        if (contextItems.length < 2) {
            contextItems.push(cleaned);
        }
    }

    // Build blocks in order
    if (contextItems.length > 0) {
        blocks.push({ type: 'context', items: contextItems });
    }
    if (insightItems.length > 0) {
        blocks.push({ type: 'insights', items: insightItems });
    }
    if (recommendationItems.length > 0) {
        blocks.push({ type: 'recommendations', items: recommendationItems });
    }
    if (nextStepItems.length > 0) {
        blocks.push({ type: 'next-step', items: nextStepItems });
    }

    // If no recommendations found but we have context, show context
    if (blocks.length === 0 && lines.length > 0) {
        blocks.push({ type: 'context', items: lines.slice(0, 3) });
    }

    return blocks;
}

/**
 * Parse a recommendation line into name + category
 */
function parseRecommendation(text: string): { name: string; category?: string; reason?: string } {
    const categoryMatch = text.match(/\b(DREAM|TARGET|SAFE)\b/i);
    const category = categoryMatch ? categoryMatch[1].toUpperCase() : undefined;

    // Known uni names
    const unis = [
        'Massachusetts Institute of Technology', 'MIT', 'Stanford University', 'Stanford',
        'Harvard University', 'Harvard', 'University of Oxford', 'Oxford',
        'University of Cambridge', 'Cambridge', 'ETH Zurich',
        'University of Toronto', 'Toronto', 'University of British Columbia', 'UBC',
        'McGill University', 'McGill', 'University of Melbourne', 'Melbourne',
        'University of Sydney', 'Sydney', 'National University of Singapore', 'NUS',
        'Technical University of Munich', 'TUM', 'RWTH Aachen',
        'University of Amsterdam', 'Amsterdam', 'Delft University of Technology', 'Delft',
        'University of Waterloo', 'Waterloo', 'University of Manchester', 'Manchester',
        'University of Edinburgh', 'Edinburgh', 'Arizona State University', 'ASU'
    ];

    let name = text;
    let reason = '';

    // Try to extract university name
    for (const uni of unis) {
        if (text.toLowerCase().includes(uni.toLowerCase())) {
            name = uni;
            // Get reason after the name
            const idx = text.toLowerCase().indexOf(uni.toLowerCase());
            const after = text.substring(idx + uni.length).replace(/^[:\-–—\s]+/, '').trim();
            if (after.length > 5 && after.length < 80) {
                reason = after.replace(/\b(DREAM|TARGET|SAFE)\b/gi, '').trim();
            }
            break;
        }
    }

    // Clean up
    name = name.replace(/\b(DREAM|TARGET|SAFE)\b/gi, '').replace(/^[:\-–—\s]+/, '').trim();
    if (name.length > 40) {
        name = name.substring(0, 37) + '...';
    }

    return { name, category, reason };
}

/**
 * Shorten text to key fact (for insights pills)
 */
function shortenToKeyFact(text: string): string {
    // Extract the key metric
    const gpaMatch = text.match(/\d\.\d+\s*GPA|GPA[:\s]*\d\.\d+/i);
    if (gpaMatch) return gpaMatch[0];

    const budgetMatch = text.match(/\$[\d,]+(?:\/year)?/);
    if (budgetMatch) return `Budget: ${budgetMatch[0]}`;

    const stageMatch = text.match(/\b(DISCOVERY|ONBOARDING|APPLICATION|LOCKED)\b/i);
    if (stageMatch) return `Stage: ${stageMatch[1]}`;

    // Truncate if too long
    if (text.length > 25) {
        return text.substring(0, 22) + '...';
    }

    return text;
}

/**
 * Shorten action to one line
 */
function shortenAction(text: string): string {
    if (text.length > 80) {
        return text.substring(0, 77) + '...';
    }
    return text;
}

export default AIMessageRenderer;
