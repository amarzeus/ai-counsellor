"use client";

import { useStore } from "@/lib/store";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";

export default function ComparisonBar() {
    const { comparisonList, removeFromComparison } = useStore();

    if (comparisonList.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {comparisonList.map((uni) => (
                            <div key={uni.id} className="relative group">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white" title={uni.name}>
                                    {uni.name.substring(0, 2)}
                                </div>
                                <button
                                    onClick={() => removeFromComparison(uni.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="text-sm">
                        <span className="font-bold">{comparisonList.length}</span> selected
                        <span className="text-slate-400 text-xs ml-1">(max 3)</span>
                    </div>
                </div>

                <Link
                    href="/compare"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                    Compare Now
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
