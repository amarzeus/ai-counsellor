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
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Intelligent SOP Reviewer
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Get instant, AI-powered feedback on your Statement of Purpose. Analysis covers structure, content strength, and grammar.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#151b2b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Paste your SOP here
                            </label>
                            <textarea
                                className="w-full h-96 p-4 rounded-lg bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                                placeholder="Start typing or paste your Statement of Purpose..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            ></textarea>

                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-slate-500">
                                    {text.split(/\s+/).filter(w => w.length > 0).length} words
                                </span>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || text.length === 0}
                                    className="inline-flex items-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Analyze SOP
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Improved Snippet (Conditional) */}
                        {result?.improved_snippet && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI Suggested Improvement</h3>
                                </div>
                                <p className="text-sm text-blue-800 dark:text-blue-200 italic leading-relaxed">
                                    "{result.improved_snippet}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {result ? (
                            <>
                                {/* Score Card */}
                                <div className={`rounded-xl p-6 border ${getScoreColor(result.overall_score)} flex flex-col items-center justify-center text-center`}>
                                    <span className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Overall Score</span>
                                    <span className="text-5xl font-bold mb-2">{result.overall_score}</span>
                                    <span className="text-xs opacity-70">out of 100</span>
                                </div>

                                {/* Feedback Summary */}
                                <div className="bg-white dark:bg-[#151b2b] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                                        <MessageCircle className="h-4 w-4 mr-2 text-slate-400" />
                                        Reviewer Feedback
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {result.ai_feedback}
                                    </p>
                                </div>

                                {/* Analysis Details */}
                                <div className="bg-white dark:bg-[#151b2b] rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">

                                    {/* Strengths */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-1.5" /> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.strengths.map((item, i) => (
                                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                                                    <span className="mr-2 mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Weaknesses */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center">
                                            <AlertTriangle className="h-4 w-4 mr-1.5" /> Areas for Improvement
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.weaknesses.map((item, i) => (
                                                <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                                                    <span className="mr-2 mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Grammar */}
                                    {result.grammar_mistakes.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1.5" /> Grammar Issues
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.grammar_mistakes.map((item, i) => (
                                                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                                                        <span className="mr-2 mt-1.5 w-1 h-1 rounded-full bg-red-500 flex-shrink-0"></span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-50 dark:bg-[#151b2b]/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                                <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                    <BookOpen className="h-6 w-6 text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Ready to Analyze</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Paste your SOP draft to get detailed feedback on strength, structure, and grammar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
