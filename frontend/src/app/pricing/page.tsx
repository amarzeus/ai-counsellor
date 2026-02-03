"use client";

import { Check, Sparkles, Gift, ArrowRight, Shield, Clock, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 text-slate-900 dark:text-white relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none opacity-40 dark:opacity-20" />

            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-1/4 w-72 h-72 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <main className="relative pt-12 sm:pt-16 pb-16 px-4 sm:px-6">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-lg mx-auto mb-8"
                >
                    {/* Beta Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-sm mb-5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Beta Launch — Free Access
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                        Start Your Journey,
                        <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                            Completely Free
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                        We're in beta — enjoy full access to all features at no cost while we build the future of study abroad guidance.
                    </p>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="max-w-md mx-auto mb-8"
                >
                    <div className="relative group">
                        {/* Glow on hover */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />

                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Beta Access</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">All features included</p>
                                    </div>
                                </div>
                                <div className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Free
                                </div>
                            </div>

                            {/* Price Display */}
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white">$0</span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm">/month</span>
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-6 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Free during beta • Pricing TBD after launch
                            </p>

                            {/* CTA */}
                            <Link
                                href="/signup"
                                className="group/btn flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl"
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                            </Link>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">What you get</span>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="space-y-3">
                                {[
                                    "Unlimited University Shortlisting",
                                    "AI Counsellor — Unlimited Chats",
                                    "Voice Input Mode",
                                    "Smart Task Management",
                                    "Profile Strength Analysis",
                                    "Application Guidance & Timelines"
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.05 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-md mx-auto"
                >
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>No credit card</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span>500+ beta users</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <div className="flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Early adopter perks</span>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
