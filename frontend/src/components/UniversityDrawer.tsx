"use client";

import { X, ExternalLink, Lock, MapPin, DollarSign, GraduationCap, Award, CheckCircle, Trash2, TrendingUp, AlertTriangle, Info, Globe, Target } from "lucide-react";
import { Shortlist } from "@/lib/api";

interface UniversityDrawerProps {
    university: Shortlist | null;
    isOpen: boolean;
    onClose: () => void;
    onLock?: (id: number) => void;
    onUnlock?: (id: number) => void;
    onRemove?: (id: number) => void;
    onShortlist?: (university: any) => void;
}

export default function UniversityDrawer({
    university,
    isOpen,
    onClose,
    onLock,
    onUnlock,
    onRemove,
    onShortlist
}: UniversityDrawerProps) {
    if (!university || !isOpen) return null;

    const { university: uni, category, is_locked } = university;

    const categoryColors = {
        DREAM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        TARGET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        SAFE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };

    const categoryDescriptions = {
        DREAM: "High reach - ambitious choice with lower acceptance probability",
        TARGET: "Good match - aligns well with your profile",
        SAFE: "Safe choice - high likelihood of acceptance"
    };

    const getCostBadge = () => {
        const cost = uni.cost_level;
        if (!cost) return null;
        const colors = {
            Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[cost as keyof typeof colors] || colors.Medium}`}>
                {cost} Cost
            </span>
        );
    };

    const getAcceptanceBadge = () => {
        const chance = uni.acceptance_chance;
        if (!chance) return null;
        const colors = {
            Low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            High: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[chance as keyof typeof colors] || colors.Medium}`}>
                {chance} Chance
            </span>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${categoryColors[category]}`}>
                                {category}
                            </span>
                            {getCostBadge()}
                            {getAcceptanceBadge()}
                            {is_locked && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">
                                    <Lock className="w-2.5 h-2.5" />
                                    Locked
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                            {uni.name}
                        </h2>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{uni.city ? `${uni.city}, ` : ""}{uni.country}</span>
                            {uni.is_public !== undefined && (
                                <>
                                    <span className="mx-1">•</span>
                                    <span>{uni.is_public ? "Public" : "Private"}</span>
                                </>
                            )}
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
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Category Description */}
                    <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {categoryDescriptions[category]}
                        </p>
                    </div>

                    {/* Key Stats */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Statistics</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-medium">Tuition/Year</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    ${uni.tuition_per_year?.toLocaleString() || "N/A"}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <Award className="w-4 h-4" />
                                    <span className="text-xs font-medium">World Ranking</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {uni.qs_ranking ? `#${uni.qs_ranking}` : uni.the_ranking ? `#${uni.the_ranking}` : uni.ranking ? `#${uni.ranking}` : "N/A"}
                                    {uni.qs_ranking && <span className="text-xs font-normal text-slate-500 ml-1">QS</span>}
                                    {!uni.qs_ranking && uni.the_ranking && <span className="text-xs font-normal text-slate-500 ml-1">THE</span>}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <GraduationCap className="w-4 h-4" />
                                    <span className="text-xs font-medium">Min GPA</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {uni.min_gpa ? uni.min_gpa.toFixed(1) : "N/A"}
                                    {uni.min_gpa && <span className="text-xs font-normal text-slate-500 ml-1">/4.0</span>}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-xs font-medium">Accept Rate</span>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {uni.acceptance_rate ? `${uni.acceptance_rate}%` : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {uni.description && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About the University</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {uni.description}
                            </p>
                        </div>
                    )}

                    {/* Fit Analysis */}
                    {(uni.fit_reason || uni.risk_reason) && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Profile Fit Analysis</h3>
                            <div className="space-y-3">
                                {uni.fit_reason && (
                                    <div className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Why It Fits</p>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-300">{uni.fit_reason}</p>
                                        </div>
                                    </div>
                                )}
                                {uni.risk_reason && (
                                    <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Risk Factors</p>
                                            <p className="text-sm text-amber-600 dark:text-amber-300">{uni.risk_reason}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Programs */}
                    {uni.programs && uni.programs.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Programs</h3>
                            <div className="flex flex-wrap gap-2">
                                {uni.programs.slice(0, 10).map((program, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                                    >
                                        {program}
                                    </span>
                                ))}
                                {uni.programs.length > 10 && (
                                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs">
                                        +{uni.programs.length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Links */}
                    {uni.official_website && (
                        <div>
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">External Links</h3>
                            <a
                                href={uni.official_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                Official University Website
                                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                            </a>
                        </div>
                    )}

                    {/* Data Source */}
                    {uni.data_source && (
                        <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                            Data source: {uni.data_source}
                        </p>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    {/* Mock Shortlist Item (Not actually shortlisted) */}
                    {university.id === -1 ? (
                        <button
                            onClick={() => onShortlist?.(uni)}
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <Target className="w-4 h-4" />
                            Add to Shortlist
                        </button>
                    ) : is_locked ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm font-medium">This university is locked for applications</span>
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
                                    Lock to get personalized application guidance and tasks
                                </p>
                                {onLock && (
                                    <button
                                        onClick={() => onLock(university.id)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
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
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
