'use client';

import React from 'react';

interface AIMessageRendererProps {
    content: string;
}

interface ParsedSection {
    type: 'context' | 'insight' | 'recommendation' | 'risk' | 'action' | 'general';
    title?: string;
    items: string[];
}

/**
 * Structured AI Message Renderer
 * Parses AI responses into scannable sections with visual hierarchy
 */
export function AIMessageRenderer({ content }: AIMessageRendererProps) {
    const sections = parseIntoSections(content);

    return (
        <div className="ai-structured-message max-w-xl space-y-4">
            {sections.map((section, idx) => (
                <SectionRenderer key={idx} section={section} />
            ))}
        </div>
    );
}

/**
 * Section Renderer - Renders each section type with distinct styling
 */
function SectionRenderer({ section }: { section: ParsedSection }) {
    switch (section.type) {
        case 'context':
            return (
                <div className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                    {section.items.map((item, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                            <HighlightedText text={item} />
                        </p>
                    ))}
                </div>
            );

        case 'insight':
            return (
                <div className="space-y-2">
                    <SectionHeader title={section.title || "Key Insights"} />
                    <ul className="space-y-1.5">
                        {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                <HighlightedText text={item} />
                            </li>
                        ))}
                    </ul>
                </div>
            );

        case 'recommendation':
            return (
                <div className="space-y-2">
                    <SectionHeader title={section.title || "Recommendations"} />
                    <div className="space-y-2">
                        {section.items.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30"
                            >
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-0.5">
                                    {i + 1}.
                                </span>
                                <span className="text-sm text-gray-800 dark:text-slate-200">
                                    <HighlightedText text={item} />
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'risk':
            return (
                <div className="space-y-2">
                    <SectionHeader title={section.title || "Notes"} muted />
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/15 rounded-lg border-l-3 border-amber-400">
                        {section.items.map((item, i) => (
                            <p key={i} className="text-xs text-amber-800 dark:text-amber-200 mb-1 last:mb-0">
                                <HighlightedText text={item} />
                            </p>
                        ))}
                    </div>
                </div>
            );

        case 'action':
            return (
                <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                            Next Step
                        </span>
                        <span className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {section.items.map((item, i) => (
                            <span key={i}><HighlightedText text={item} /></span>
                        ))}
                    </p>
                </div>
            );

        default:
            return (
                <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                    {section.items.map((item, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                            <HighlightedText text={item} />
                        </p>
                    ))}
                </div>
            );
    }
}

/**
 * Section Header Component
 */
function SectionHeader({ title, muted = false }: { title: string; muted?: boolean }) {
    return (
        <div className={`flex items-center gap-2 ${muted ? 'opacity-70' : ''}`}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                {title}
            </h4>
            <span className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
        </div>
    );
}

/**
 * Text with highlighted entities (universities, numbers, categories)
 */
function HighlightedText({ text }: { text: string }) {
    // Parse and highlight entities
    const parts = parseHighlights(text);

    return (
        <>
            {parts.map((part, i) => {
                if (part.type === 'university') {
                    return (
                        <strong key={i} className="font-semibold text-gray-900 dark:text-white">
                            {part.text}
                        </strong>
                    );
                }
                if (part.type === 'number') {
                    return (
                        <span key={i} className="px-1 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                            {part.text}
                        </span>
                    );
                }
                if (part.type === 'category') {
                    const colors = {
                        'DREAM': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                        'TARGET': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                        'SAFE': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    };
                    return (
                        <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${colors[part.text as keyof typeof colors] || colors['TARGET']}`}
                        >
                            {part.text}
                        </span>
                    );
                }
                return <span key={i}>{part.text}</span>;
            })}
        </>
    );
}

/**
 * Parse AI response into structured sections
 */
function parseIntoSections(content: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    let currentSection: ParsedSection = { type: 'context', items: [] };
    let isFirstParagraph = true;

    for (const line of lines) {
        // Detect section headers
        const lowerLine = line.toLowerCase();

        // Check for markdown headers or keyword-based sections
        if (line.startsWith('##') || line.startsWith('**') && line.endsWith('**')) {
            // Save current section if it has items
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }

            const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            const sectionType = detectSectionType(title);
            currentSection = { type: sectionType, title, items: [] };
            continue;
        }

        // Detect recommendation patterns
        if (lowerLine.includes('recommend') || lowerLine.includes('universities for you') ||
            lowerLine.includes('options') || lowerLine.includes('here are')) {
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
            }
            currentSection = { type: 'recommendation', items: [] };
            // Include this line as context for the section
            if (!lowerLine.includes('here are') && !lowerLine.startsWith('-')) {
                currentSection.items.push(cleanLine(line));
            }
            continue;
        }

        // Detect risk/warning patterns
        if (lowerLine.includes('however') || lowerLine.includes('note:') ||
            lowerLine.includes('keep in mind') || lowerLine.includes('risk') ||
            lowerLine.includes('caution') || lowerLine.includes('important:')) {
            if (currentSection.items.length > 0 && currentSection.type !== 'risk') {
                sections.push(currentSection);
                currentSection = { type: 'risk', items: [] };
            }
        }

        // Detect action/next step patterns
        if (lowerLine.includes('next step') || lowerLine.includes('let me know') ||
            lowerLine.includes('would you like') || lowerLine.includes('shall i') ||
            lowerLine.includes('ready to')) {
            if (currentSection.items.length > 0 && currentSection.type !== 'action') {
                sections.push(currentSection);
                currentSection = { type: 'action', items: [] };
            }
        }

        // Handle bullet points
        if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
            const cleanedLine = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim();

            // If we're in context mode and see bullets, switch to insight
            if (currentSection.type === 'context' || currentSection.type === 'general') {
                if (currentSection.items.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = { type: 'insight', items: [] };
            }

            currentSection.items.push(cleanedLine);
            continue;
        }

        // Regular paragraph
        if (isFirstParagraph) {
            currentSection.type = 'context';
            isFirstParagraph = false;
        }

        currentSection.items.push(cleanLine(line));
    }

    // Push final section
    if (currentSection.items.length > 0) {
        sections.push(currentSection);
    }

    // Merge small sections and clean up
    return mergeSections(sections);
}

/**
 * Detect section type from header text
 */
function detectSectionType(title: string): ParsedSection['type'] {
    const lower = title.toLowerCase();

    if (lower.includes('insight') || lower.includes('analysis') || lower.includes('profile')) {
        return 'insight';
    }
    if (lower.includes('recommend') || lower.includes('option') || lower.includes('universit')) {
        return 'recommendation';
    }
    if (lower.includes('risk') || lower.includes('note') || lower.includes('warning') || lower.includes('consider')) {
        return 'risk';
    }
    if (lower.includes('next') || lower.includes('action') || lower.includes('step')) {
        return 'action';
    }

    return 'general';
}

/**
 * Clean line of markdown artifacts
 */
function cleanLine(line: string): string {
    return line
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^#+\s*/, '')
        .trim();
}

/**
 * Merge consecutive sections of same type
 */
function mergeSections(sections: ParsedSection[]): ParsedSection[] {
    if (sections.length <= 1) return sections;

    const merged: ParsedSection[] = [];
    let current = sections[0];

    for (let i = 1; i < sections.length; i++) {
        if (sections[i].type === current.type) {
            current.items.push(...sections[i].items);
        } else {
            merged.push(current);
            current = sections[i];
        }
    }
    merged.push(current);

    return merged;
}

/**
 * Parse text to identify and tag entities for highlighting
 */
function parseHighlights(text: string): Array<{ type: 'text' | 'university' | 'number' | 'category'; text: string }> {
    const parts: Array<{ type: 'text' | 'university' | 'number' | 'category'; text: string }> = [];

    // Known university names to highlight
    const universities = [
        'MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge', 'ETH Zurich',
        'University of Toronto', 'University of British Columbia', 'McGill',
        'University of Melbourne', 'University of Sydney', 'NUS',
        'Technical University of Munich', 'TUM', 'RWTH Aachen',
        'University of Amsterdam', 'Delft', 'University of Waterloo',
        'University of Manchester', 'University of Edinburgh',
        'Arizona State University', 'ASU',
        'Massachusetts Institute of Technology',
        'National University of Singapore'
    ];

    // Categories
    const categories = ['DREAM', 'TARGET', 'SAFE'];

    // Build regex pattern
    const uniPattern = universities.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const catPattern = categories.join('|');
    const numPattern = '\\$[\\d,]+(?:\\/year)?|\\d\\.\\d+\\s*GPA|GPA\\s*(?:of\\s*)?\\d\\.\\d+|\\d+(?:\\.\\d+)?%';

    const combinedPattern = new RegExp(`(${uniPattern}|${catPattern}|${numPattern})`, 'gi');

    let lastIndex = 0;
    let match;

    while ((match = combinedPattern.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
        }

        const matchedText = match[0];
        const upperMatch = matchedText.toUpperCase();

        // Determine type
        if (categories.includes(upperMatch)) {
            parts.push({ type: 'category', text: upperMatch });
        } else if (matchedText.match(/\$|GPA|%/i)) {
            parts.push({ type: 'number', text: matchedText });
        } else {
            parts.push({ type: 'university', text: matchedText });
        }

        lastIndex = combinedPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({ type: 'text', text: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', text }];
}

export default AIMessageRenderer;
