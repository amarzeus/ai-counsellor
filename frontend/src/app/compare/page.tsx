"use client";

import { useStore } from "@/lib/store";
import { ArrowLeft, Check, Minus, AlertCircle, TrendingUp, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { University } from "@/lib/api";

export default function ComparePage() {
    const { comparisonList, removeFromComparison } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (comparisonList.length === 0) {
            router.push('/universities');
        }
    }, [comparisonList, router]);

    if (comparisonList.length === 0) return null;

    const features: { label: string; key: keyof University | "country-city"; format?: (val: any, uni: University) => React.ReactNode }[] = [
        { label: "Tuition / Year", key: "tuition_per_year", format: (val: any) => `$${(val as number).toLocaleString()}` },
        { label: "Ranking (QS)", key: "qs_ranking", format: (val: any) => `#${val}` },
        { label: "Acceptance", key: "acceptance_chance", format: (val: any) => val },
        { label: "Cost Level", key: "cost_level", format: (val: any) => val },
        { label: "Location", key: "country-city", format: (_: any, uni: University) => `${uni.city || ''}, ${uni.country}` },
        { label: "Type", key: "is_public", format: (val: any) => val ? "Public" : "Private" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <Link href="/universities" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Universities
                </Link>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Compare Universities</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Side-by-side comparison of your selected options.</p>

                <div className="overflow-x-auto">
                    <table className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="p-6 text-left w-48 bg-slate-50 dark:bg-slate-800/50 rounded-tl-2xl">
                                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Feature</span>
                                </th>
                                {comparisonList.map((uni) => (
                                    <th key={uni.id} className="p-6 text-left min-w-[240px]">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{uni.name}</div>
                                                <div className="flex items-center gap-2">
                                                    {uni.category && (
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                                            {uni.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromComparison(uni.id)}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {features.map((feature) => (
                                <tr key={feature.label}>
                                    <td className="p-6 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                        {feature.label}
                                    </td>
                                    {comparisonList.map((uni) => {
                                        let val;
                                        if (feature.key === "country-city") {
                                            if (feature.format) {
                                                val = feature.format(null, uni);
                                            }
                                        } else {
                                            val = uni[feature.key];
                                            if (feature.format && val !== undefined) val = feature.format(val, uni);
                                        }

                                        return (
                                            <td key={uni.id} className="p-6 text-slate-900 dark:text-white font-medium">
                                                {val || "—"}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            <tr>
                                <td className="p-6 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30">
                                    Fit Analysis
                                </td>
                                {comparisonList.map((uni) => (
                                    <td key={uni.id} className="p-6 align-top">
                                        {uni.fit_reason && (
                                            <div className="mb-3 flex gap-2 text-sm text-green-700 dark:text-green-400">
                                                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                                {uni.fit_reason}
                                            </div>
                                        )}
                                        {uni.risk_reason && (
                                            <div className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                {uni.risk_reason}
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
