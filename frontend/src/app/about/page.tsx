import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 py-24 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-32">

                {/* 1. Hero Section */}
                <section className="text-center space-y-6 max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                        About AI Counsellor
                    </h1>
                    <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                        A structured, AI-guided platform built to bring clarity and discipline to the study-abroad journey.
                    </p>
                </section>

                {/* 2. The Problem We Saw */}
                <section className="grid md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-4">
                        <h2 className="text-2xl font-bold text-neutral-900 sticky top-24">
                            The Problem We Saw
                        </h2>
                    </div>
                    <div className="md:col-span-8 space-y-6 text-lg text-neutral-600 leading-relaxed">
                        <p>
                            Study abroad planning is fragmented. Students juggle expensive counsellors, endless spreadsheets, scattered WhatsApp messages, and generic AI tools that hallucinate answers.
                        </p>
                        <p>
                            The result is anxiety. Advice is often unstructured, inconsistent, and hard to trust. We realized that students don't just need more information—they need a reliable filter and a clear path forward.
                        </p>
                    </div>
                </section>

                {/* 3. Our Approach */}
                <section className="grid md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-4">
                        <h2 className="text-2xl font-bold text-neutral-900 sticky top-24">
                            Our Approach
                        </h2>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                        <p className="text-lg text-neutral-600 leading-relaxed">
                            AI Counsellor is not a chatbot. It is a decision-guided system. We believe that clarity comes from structure, not random conversation.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                <h3 className="font-semibold text-neutral-900 mb-2">Stage-Based Journey</h3>
                                <p className="text-neutral-600 text-sm">Every user follows a deliberate progression. No jumping ahead until you're ready.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                <h3 className="font-semibold text-neutral-900 mb-2">Discipline over Randomness</h3>
                                <p className="text-neutral-600 text-sm">We prioritize what you need to do, not just what you want to hear.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                <h3 className="font-semibold text-neutral-900 mb-2">Explainable AI</h3>
                                <p className="text-neutral-600 text-sm">Recommendations come with reasons. No black-box magic, just transparent logic.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                                <h3 className="font-semibold text-neutral-900 mb-2">Intentional Progression</h3>
                                <p className="text-neutral-600 text-sm">From discovery to application, every step builds on the last.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. What Makes Us Different */}
                <section className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-10 text-center">
                        What Makes AI Counsellor Different
                    </h2>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {/* 1 */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-neutral-100 last:border-0">
                            <div className="flex items-center gap-3 text-neutral-500">
                                <X className="w-5 h-5 text-red-400 shrink-0" />
                                <span>Generic AI chat → random answers</span>
                            </div>
                            <div className="hidden sm:block text-neutral-300">→</div>
                            <div className="flex items-center gap-3 text-neutral-900 font-medium">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Stage-aware guidance</span>
                            </div>
                        </div>

                        {/* 2 */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-neutral-100 last:border-0">
                            <div className="flex items-center gap-3 text-neutral-500">
                                <X className="w-5 h-5 text-red-400 shrink-0" />
                                <span>One-time advice</span>
                            </div>
                            <div className="hidden sm:block text-neutral-300">→</div>
                            <div className="flex items-center gap-3 text-neutral-900 font-medium">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Continuous planning & execution</span>
                            </div>
                        </div>

                        {/* 3 */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-neutral-100 last:border-0">
                            <div className="flex items-center gap-3 text-neutral-500">
                                <X className="w-5 h-5 text-red-400 shrink-0" />
                                <span>Manual tracking</span>
                            </div>
                            <div className="hidden sm:block text-neutral-300">→</div>
                            <div className="flex items-center gap-3 text-neutral-900 font-medium">
                                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span>Automated tasks & milestones</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Built for Students, Not Algorithms */}
                <section className="grid md:grid-cols-12 gap-12 items-start">
                    <div className="md:col-span-4">
                        <h2 className="text-2xl font-bold text-neutral-900 sticky top-24">
                            Built for Students
                        </h2>
                    </div>
                    <div className="md:col-span-8 space-y-6 text-lg text-neutral-600 leading-relaxed">
                        <p>
                            We built this with a deep respect for your agency. The AI guides you, but you stay in control. It never auto-decides critical steps—locking universities always requires your explicit confirmation.
                        </p>
                        <p>
                            Whether you use voice or text, the rules remain the same. It's a system designed to support your decisions, not replace your judgment.
                        </p>
                    </div>
                </section>

                {/* 6. Our Vision */}
                <section className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-2xl font-bold text-neutral-900">
                        Our Vision
                    </h2>
                    <p className="text-lg text-neutral-600 leading-relaxed">
                        To make study-abroad planning calm. To reduce anxiety. To replace chaos with clarity.
                    </p>
                </section>

                {/* 7. Closing Statement */}
                <section className="text-center py-12 border-t border-neutral-200">
                    <p className="text-xl text-neutral-900 font-medium mb-8 max-w-2xl mx-auto">
                        AI Counsellor exists to guide — not overwhelm — students through one of the most important decisions of their lives.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="rounded-full px-8">
                            Start Your Journey <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </section>

            </div>
        </div>
    );
}
