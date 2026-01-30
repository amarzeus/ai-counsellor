'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, CheckCircle, TrendingUp, Target, BookOpen, Clock, Award, AlertTriangle, Plus, AlertCircle, Sparkles } from 'lucide-react';

interface UniversityCardProps {
    university: {
        university_id: number;
        name?: string;
        country?: string;
        tuition?: number;
        ranking?: number;
        category: 'DREAM' | 'TARGET' | 'SAFE';
        fit_reason: string;
        risk_reason: string;
        is_shortlisted?: boolean;
        program_name?: string;
        duration?: string;
    };
    index: number;
    onShortlistToggle: (uniId: number, category: string, isShortlisted: boolean | undefined) => void;
}

/**
 * University Card - Final Polish
 * Single cohesive surface, clear hierarchy, reduced noise.
 */
export function UniversityCard({ university: uni, index, onShortlistToggle }: UniversityCardProps) {
    const categoryStyles = {

        TARGET: {
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            border: 'border-blue-200 dark:border-blue-800',
            risk: 'Medium',
            riskColor: 'text-amber-500',
            chance: 'Strong fit for profile',
        },
        SAFE: {
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            border: 'border-emerald-200 dark:border-emerald-800',
            risk: 'Low',
            riskColor: 'text-green-500',
            chance: 'Low-risk option',
        },
        DREAM: {
            badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            border: 'border-purple-200 dark:border-purple-800',
            risk: 'High',
            riskColor: 'text-red-500',
            chance: 'Ambitious goal',
        },
    };

    const styles = categoryStyles[uni.category] || categoryStyles.TARGET;

    // Derived Data
    const minGPA = uni.category === 'DREAM' ? '3.7+' : uni.category === 'SAFE' ? '3.0+' : '3.4+';
    const programName = uni.program_name || 'Computer Science';
    const duration = uni.duration || '2 years';
    const rankingText = uni.ranking ? `#${uni.ranking} World` : 'Top 100';

    // Insight Processing
    // DO NOT truncate. Allow full text to render to avoid cutting off decimals (e.g. "3.5").
    const cleanInsight = (uni.fit_reason || uni.risk_reason || 'Strong match for your profile')
        .replace(/^[-•]\s*/, '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="group flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200 overflow-hidden"
        >
            {/* 1. Header: Identity - Reduced Padding */}
            <div className="p-2.5 pb-2 flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {uni.name || `University #${uni.university_id}`}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {uni.country || 'USA'}
                        </span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {programName}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${styles.badge} border ${styles.border}`}>
                        {uni.category}
                    </div>
                    {/* Explicit Chance Clarity */}
                    <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                        {styles.chance}
                    </span>
                </div>
            </div>

            {/* 2. Metrics Grid: Compact Density */}
            <div className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                    <DollarSign className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium truncate">
                        {uni.tuition ? `$${Math.round(uni.tuition / 1000)}k/yr` : '$50k/yr'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate">
                        {duration}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <Award className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate">
                        {rankingText}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate">
                        GPA {minGPA}
                    </span>
                </div>
            </div>

            {/* 3. Footer: Insight & Action */}
            <div className="p-2.5 pt-2 flex flex-col gap-3 flex-1">
                {/* Secondary AI Insight - Muted Hierarchy */}
                <div className="flex items-start gap-2 flex-1">
                    <Sparkles className="w-3 h-3 text-blue-300 dark:text-blue-500/50 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed">
                        {cleanInsight}
                    </p>
                </div>

                {/* Primary/Secondary CTA - Consistent Tone */}
                <button
                    onClick={() => onShortlistToggle(uni.university_id, uni.category, uni.is_shortlisted)}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all
            ${uni.is_shortlisted
                            ? 'bg-transparent text-green-600 dark:text-green-500 border border-transparent cursor-default'
                            : 'bg-blue-600/90 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                        }`}
                >
                    {uni.is_shortlisted ? (
                        <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Shortlisted</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-3 h-3" />
                            <span>Add to Shortlist</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

export default UniversityCard;
