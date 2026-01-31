"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FAQItem {
    question: string;
    answer: React.ReactNode;
}

const faqs: FAQItem[] = [
    {
        question: "What exactly is AI Counsellor?",
        answer: "AI Counsellor is a structured, intelligent guidance platform designed to help students navigate their study-abroad journey. Unlike generic chatbots, it follows a specific, decision-based framework to guide you through profiling, university discovery, shortlisting, and locking your choices."
    },
    {
        question: "Is AI Counsellor really free?",
        answer: "Yes! As part of our mission to democratize study-abroad guidance, all core features—including our AI chat, university database, extensive filtering, and application roadmap tools—are completely free for all users."
    },
    {
        question: "How does the 'University Locking' feature work?",
        answer: "Locking a university is a commitment step. When you lock a university, our system generates a specific checklist of tasks (SOPs, application forms, deadlines) tailored to that institution. You can unlock a university at any time if you change your mind."
    },
    {
        question: "Where does your university data come from?",
        answer: "We aggregate data from official university websites, verified academic rankings (QS, THE), and trusted educational databases. We strive for accuracy but always recommend verifying specific details like tuition and deadlines on the university's official portal."
    },
    {
        question: "Is my personal data safe?",
        answer: (
            <>
                Absolutely. We take data privacy seriously. Your profile data is used solely to provide personalized recommendations. We do not sell your data to third parties. For more details, please read our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </>
        )
    },
    {
        question: "How do I contact support?",
        answer: (
            <>
                If you have any issues or specific questions, you can reach out to us via our <Link href="/contact" className="text-blue-600 hover:underline">Contact Page</Link>. We're here to help!
            </>
        )
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-blue-600 transition-colors mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                            Frequently Asked Questions
                        </h1>
                    </div>
                    <p className="text-lg text-neutral-600 leading-relaxed ml-1">
                        Answers to common questions about using AI Counsellor for your study abroad journey.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${openIndex === index
                                    ? 'border-blue-200 shadow-md ring-1 ring-blue-100'
                                    : 'border-neutral-200 shadow-sm hover:border-neutral-300'
                                }`}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                aria-expanded={openIndex === index}
                            >
                                <span className={`font-semibold text-lg ${openIndex === index ? 'text-blue-700' : 'text-neutral-900'}`}>
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-blue-500 shrink-0 ml-4" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0 ml-4" />
                                )}
                            </button>

                            <div
                                className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-neutral-600 leading-relaxed border-t border-transparent">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center py-8 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-neutral-900 font-medium mb-2">Still have questions?</p>
                    <p className="text-neutral-500 mb-6 text-sm">We&apos;re happy to help clear things up.</p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
