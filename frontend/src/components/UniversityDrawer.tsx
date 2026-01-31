"use client";

import { X, ExternalLink, Lock, Unlock, MapPin, DollarSign, GraduationCap, Award, Building2, CheckCircle, Trash2 } from "lucide-react";
import { Shortlist } from "@/lib/api";

interface UniversityDrawerProps {
    university: Shortlist | null;
    isOpen: boolean;
    onClose: () => void;
    onLock?: (id: number) => void;
    onUnlock?: (id: number) => void;
    onRemove?: (id: number) => void;
}

export default function UniversityDrawer({
    university,
    isOpen,
    onClose,
    onLock,
    onUnlock,
    onRemove
}: UniversityDrawerProps) {
    if (!university || !isOpen) return null;

    const { university: uni, category, is_locked } = university;

    const categoryColors = {
        DREAM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        TARGET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        SAFE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${categoryColors[category]}`}>
                                {category}
                            </span>
                            {is_locked && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                                    <Lock className="w-2.5 h-2.5" />
                                    Locked
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {uni.name}
                        </h2>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{uni.city ? `${uni.city}, ` : ""}{uni.country}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase">Tuition/Year</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                ${uni.tuition_per_year?.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                <Award className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase">Ranking</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                {uni.qs_ranking ? `#${uni.qs_ranking} QS` : uni.the_ranking ? `#${uni.the_ranking} THE` : "—"}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase">Min GPA</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                {uni.min_gpa || "—"}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase">Acceptance</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                {uni.acceptance_rate ? `${uni.acceptance_rate}%` : uni.acceptance_chance || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {uni.description && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Overview</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {uni.description}
                            </p>
                        </div>
                    )}

                    {/* Fit Analysis */}
                    {(uni.fit_reason || uni.risk_reason) && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Fit Analysis</h3>
                            {uni.fit_reason && (
                                <div className="mb-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                        <span className="font-semibold">Why it fits:</span> {uni.fit_reason}
                                    </p>
                                </div>
                            )}
                            {uni.risk_reason && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                                    <p className="text-sm text-amber-700 dark:text-amber-400">
                                        <span className="font-semibold">Risk:</span> {uni.risk_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Programs */}
                    {uni.programs && uni.programs.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Programs</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {uni.programs.map((program, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs"
                                    >
                                        {program}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Official Website */}
                    {uni.official_website && (
                        <a
                            href={uni.official_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Visit Official Website
                        </a>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    {is_locked ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-medium">This university is locked</span>
                            </div>
                            {onUnlock && (
                                <button
                                    onClick={() => onUnlock(university.id)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Unlock
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <p className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                                    Lock to get application guidance
                                </p>
                                {onLock && (
                                    <button
                                        onClick={() => onLock(university.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Lock University
                                    </button>
                                )}
                            </div>

                            {/* Remove from Shortlist */}
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(university.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove from Shortlist
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
