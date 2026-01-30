'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, GraduationCap, CheckCircle, TrendingUp, Target, BookOpen, Clock, Award, AlertTriangle } from 'lucide-react';

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
 * Decision-focused University Card
 * Information-rich, compact, scannable in <2 seconds
 */
export function UniversityCard({ university: uni, index, onShortlistToggle }: UniversityCardProps) {
    const categoryStyles = {
        DREAM: {
            badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
            border: 'border-l-purple-500',
            risk: 'High',
            riskColor: 'text-red-500',
        },
        TARGET: {
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
            border: 'border-l-blue-500',
            risk: 'Medium',
            riskColor: 'text-amber-500',
        },
        SAFE: {
            badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
            border: 'border-l-green-500',
            risk: 'Low',
            riskColor: 'text-green-500',
        },
    };

    const styles = categoryStyles[uni.category] || categoryStyles.TARGET;

    // Derive data from category if not provided
    const minGPA = uni.category === 'DREAM' ? '3.7+' : uni.category === 'SAFE' ? '3.0+' : '3.4+';
    const programName = uni.program_name || 'Computer Science';
    const duration = uni.duration || '2 years';
    const rankingText = uni.ranking ? `#${uni.ranking} World` : 'Top 100';

    // AI insight (1 line max)
    const insight = uni.fit_reason
        ? (uni.fit_reason.length > 110 ? uni.fit_reason.substring(0, 107) + '...' : uni.fit_reason)
        : 'Strong match for your profile';

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg border-l-[3px] ${styles.border} hover:shadow-md transition-shadow`}
        >
            {/* Header: Name + Badge + Country */}
            <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                            {uni.name || `University #${uni.university_id}`}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
                                <MapPin className="w-2 h-2" />
                                {uni.country || 'USA'}
                            </span>
                            <span className="text-[9px] text-gray-400">•</span>
                            <span className="text-[9px] text-gray-500 dark:text-slate-400">{programName}</span>
                        </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase flex-shrink-0 ${styles.badge}`}>
                        {uni.category}
                    </span>
                </div>
            </div>

            {/* Key Metrics - 3x2 Grid */}
            <div className="px-2.5 py-1.5 grid grid-cols-3 gap-x-2 gap-y-0.5 text-[9px] bg-gray-50 dark:bg-slate-900/50">
                {/* Row 1 */}
                <div className="flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">
                        {uni.tuition ? `$${Math.round(uni.tuition / 1000)}k/yr` : '$50k/yr'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">{duration}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">{rankingText}</span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">GPA {minGPA}</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                    <AlertTriangle className="w-2.5 h-2.5 text-gray-400" />
                    <span className={`font-medium ${styles.riskColor}`}>
                        {styles.risk} competition
                    </span>
                </div>
            </div>

            {/* AI Insight (1 line, muted) */}
            <div className="px-2.5 py-1 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-start gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[9px] text-gray-500 dark:text-slate-400 leading-tight">
                        {insight}
                    </p>
                </div>
            </div>

            {/* Action Button */}
            <div className="px-2.5 pb-1.5">
                <button
                    onClick={() => onShortlistToggle(uni.university_id, uni.category, uni.is_shortlisted)}
                    className={`w-full py-1 rounded text-[9px] font-semibold transition-all flex items-center justify-center gap-1
            ${uni.is_shortlisted
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {uni.is_shortlisted ? (
                        <><CheckCircle className="w-2.5 h-2.5" /> Shortlisted</>
                    ) : (
                        'Add to Shortlist'
                    )}
                </button>
            </div>
        </motion.div>
    );
}

export default UniversityCard;
