"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { sopApi, SOPReviewResponse } from "@/lib/api";
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, Lightbulb, BookOpen, AlertCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SOPReviewPage() {
    const router = useRouter();
    const { user } = useStore();
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SOPReviewResponse | null>(null);

    useEffect(() => {
        // Basic auth check
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Stage check: Must be at least LOCKED (Stage 3)
        // Actually, user object might not be loaded yet, so handle that.
        if (user && user.current_stage && ["ONBOARDING", "DISCOVERY"].includes(user.current_stage)) {
            toast.error("You must lock a university to unlock SOP Review.");
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleAnalyze = async () => {
        if (!text.trim() || text.split(" ").length < 50) {
            toast.error("Please enter at least 50 words.");
            return;
        }

        setLoading(true);
        try {
            const response = await sopApi.review({ text });
            setResult(response.data);
            toast.success("Analysis complete!");
        } catch (error: any) {
            console.error("Analysis failed", error);
            toast.error(error.response?.data?.detail || "Analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    if (!user) {
        // Loading state for auth
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300 pb-12">
            <div className="max-w-7xl mx-auto px-6 py-6">

                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                            Intelligent SOP Reviewer
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            AI-powered analysis of your Statement of Purpose. Get instant feedback on structure, tone, and impact.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Editor Section (8 Cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[400px]">

                            {/* Editor Toolbar */}
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SOP Editor</span>
                                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Draft Mode</span>
                                    </div>
                                </div>
                                <span className={`text-xs font-mono font-medium ${text.split(/\s+/).filter(w => w.length > 0).length < 50 ? 'text-amber-500' : 'text-slate-500'}`}>
                                    {text.split(/\s+/).filter(w => w.length > 0).length} words
                                </span>
                            </div>

                            {/* Text Area */}
                            <div className="flex-1 relative">
                                <textarea
                                    className="w-full h-full p-5 bg-transparent text-slate-800 dark:text-slate-200 resize-none outline-none font-serif text-lg leading-relaxed placeholder-slate-300 dark:placeholder-slate-700"
                                    placeholder="Paste your Statement of Purpose here..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    spellCheck={false}
                                ></textarea>

                                {text.length === 0 && (
                                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30">
                                        <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
                                        <p className="text-sm text-slate-500 font-medium">Ready to write your future</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex justify-end">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || text.length === 0}
                                    className="inline-flex items-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Analyzing Document...
                                        </>
                                    ) : (
                                        <>
                                            <Lightbulb className="h-4 w-4 mr-2" />
                                            Analyze SOP
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Improved Snippet (Below Editor) */}
                        {result?.improved_snippet && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Lightbulb className="h-4 w-4" />
                                    </div>
                                    <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100 uppercase tracking-wide">AI Suggested Refinement</h3>
                                </div>
                                <div className="bg-white/60 dark:bg-white/5 p-4 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                                    <p className="text-sm text-blue-900 dark:text-blue-200 italic leading-relaxed font-serif">
                                        "{result.improved_snippet}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Results (4 Cols) - Sticky */}
                    <div className="lg:col-span-4 space-y-6 sticky top-6">
                        {result ? (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
                                {/* Score Card */}
                                <div className="bg-white dark:bg-[#151b2b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
                                    <div className={`absolute top-0 inset-x-0 h-1 ${result.overall_score >= 80 ? 'bg-green-500' : result.overall_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Overall Strength</h3>
                                    <div className="flex items-center justify-center mb-2">
                                        <span className={`text-5xl font-bold tracking-tighter ${getScoreColor(result.overall_score).split(' ')[0]}`}>
                                            {result.overall_score}
                                        </span>
                                        <span className="text-xl text-slate-300 dark:text-slate-600 ml-2 font-light">/100</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Based on structure, grammar & impact</p>
                                </div>

                                {/* Feedback Summary */}
                                <div className="bg-white dark:bg-[#151b2b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4 text-slate-400" />
                                        Reviewer Feedback
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        {result.ai_feedback}
                                    </p>
                                </div>

                                {/* Analysis Details */}
                                <div className="bg-white dark:bg-[#151b2b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    {/* Strengths */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Strengths
                                        </h4>
                                        <ul className="space-y-3">
                                            {result.strengths.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Areas for Improvement
                                        </h4>
                                        <ul className="space-y-3">
                                            {result.weaknesses.map((item, i) => (
                                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Grammar */}
                                    {result.grammar_mistakes.length > 0 && (
                                        <div className="p-5 bg-red-50/30 dark:bg-red-900/10">
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Grammar Issues
                                            </h4>
                                            <ul className="space-y-3">
                                                {result.grammar_mistakes.map((item, i) => (
                                                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100/50 dark:bg-[#151b2b]/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center min-h-[250px] flex flex-col items-center justify-center">
                                <div className="p-4 rounded-full bg-white dark:bg-slate-800 mb-4 shadow-sm">
                                    <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Ready to Analyze</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
                                    Paste your SOP draft to get detailed AI feedback on strength, structure, and grammar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
