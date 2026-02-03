"use client";

import { Check, Sparkles, Gift } from "lucide-react";
import Link from "next/link";
// import Navbar from "@/components/Navbar";
import { Header } from "@/components/ui/header-1";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
            {/* Navbar is handled by layout.tsx usually, but if not, use the new Header */}
            {/* Assuming layout.tsx includes Header, or we need to add Header-1 here if specific */}
            {/* For now, removing old Navbar to avoid duplicates if Layout has one, or replacing if not. */}
            <main className="pt-32 px-6 max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-4">
                        <Gift className="w-4 h-4" />
                        Limited Time Offer
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        All Features Free
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We&apos;re currently offering full access to all premium features at no cost.
                        Start your study abroad journey today!
                    </p>
                </div>

                {/* Single Card */}
                <div className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl p-8 border-2 border-emerald-500 dark:border-emerald-500 shadow-2xl relative overflow-hidden max-w-xl mx-auto">

                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                        FREE ACCESS
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Full Access</h3>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-bold">$0</span>
                        <span className="text-slate-500">/forever</span>
                        <span className="ml-2 text-sm line-through text-slate-400">$29/mo</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Get complete access to all AI Counsellor features while we&apos;re in beta.
                    </p>

                    <Link
                        href="/dashboard"
                        className="block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-center hover:shadow-lg hover:shadow-emerald-500/25 transition transform hover:scale-[1.02]"
                    >
                        Get Started Free
                    </Link>

                    <div className="mt-8 space-y-4">
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Everything included:</div>
                        <FeatureItem text="Unlimited University Shortlisting" />
                        <FeatureItem text="Lock Universities & Generate Roadmap" />
                        <FeatureItem text="AI Counsellor Chat (Unlimited)" />
                        <FeatureItem text="Voice Input Mode" />
                        <FeatureItem text="Automated Task Management" />
                        <FeatureItem text="Profile Analysis & Recommendations" />
                        <FeatureItem text="Application Guidance" />
                    </div>

                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                    No credit card required. No hidden fees. Just start using.
                </p>
            </main>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full p-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{text}</span>
        </div>
    );
}
