import React from 'react';
import {
    UserCheck,
    Search,
    ListChecks,
    Lock,
    CalendarCheck,
    Mic,
} from 'lucide-react';

export default function HowItWorksPage() {
    const steps = [
        {
            number: 1,
            title: "Smart Onboarding",
            description: "We start by understanding you. The AI collects your academic background, budget, preferred countries, and career goals to build a comprehensive profile. You remain in control of your data at all times.",
            icon: UserCheck
        },
        {
            number: 2,
            title: "University Discovery",
            description: "Based on your unique profile, our AI suggests Dream, Target, and Safe universities. Every recommendation comes with a clear reason—no black-box decisions, just transparent guidance.",
            icon: Search
        },
        {
            number: 3,
            title: "Shortlisting",
            description: "Review your matches and create a shortlist. The AI helps you compare options side-by-side, ensuring you prioritize the programs that best align with your aspirations.",
            icon: ListChecks
        },
        {
            number: 4,
            title: "Locking Universities",
            description: "Commitment creates focus. Locking your final university choices signals the AI to shift gears from exploration to execution, preventing decision fatigue and keeping you on track.",
            icon: Lock
        },
        {
            number: 5,
            title: "Application Planning",
            description: "Once locked, the AI generates a tailored action plan. From document checklists to submission deadlines, every task is organized and tracked so you never miss a beat.",
            icon: CalendarCheck
        },
        {
            number: 6,
            title: "AI Assistance",
            description: "Need clarification? Our AI is available via text for precise answers or voice for natural guidance. It uses the same intelligent core to keep your journey unified and rule-compliant.",
            icon: Mic
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 py-24 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-24">

                {/* 1. Hero Section */}
                <section className="text-center space-y-6">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                        How AI Counsellor Guides <br className="hidden sm:block" /> Your Study-Abroad Journey
                    </h1>
                    <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                        A structured, AI-guided process — from profile building to application readiness.
                    </p>
                </section>

                {/* 2. Step-by-Step Flow */}
                <section className="relative space-y-8 before:absolute before:left-4 sm:before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-neutral-200 lg:before:hidden">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="relative flex flex-col lg:flex-row gap-6 lg:gap-12 items-start bg-white p-6 sm:p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Icon & Number */}
                            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200 z-10">
                                <step.icon className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-3 pt-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded uppercase tracking-wider">
                                        Step {step.number}
                                    </span>
                                    <h3 className="text-xl font-bold text-neutral-900">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-neutral-600 leading-relaxed max-w-2xl">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 3. Voice Interaction Rules */}
                <section className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-sm space-y-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-neutral-900">
                            Two Ways to Speak
                        </h2>
                        <p className="text-neutral-600">
                            Voice interaction is designed for specific needs.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Dictation Mode */}
                        <div className="space-y-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-full text-neutral-600">
                                <Mic className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">Voice Dictation</h3>
                            <ul className="space-y-3 text-neutral-600 text-sm leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-neutral-400 shrink-0" />
                                    Converts your speech directly to text.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-neutral-400 shrink-0" />
                                    Lives inside the chat input field.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-neutral-400 shrink-0" />
                                    Does <span className="font-semibold text-neutral-900">not</span> auto-send messages.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-neutral-400 shrink-0" />
                                    Perfect for composing detailed queries quickly.
                                </li>
                            </ul>
                        </div>

                        {/* Assistant Mode */}
                        <div className="space-y-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full text-blue-600">
                                <Mic className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">Voice Assistant</h3>
                            <ul className="space-y-3 text-neutral-600 text-sm leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 shrink-0" />
                                    A natural conversation mode.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 shrink-0" />
                                    The AI speaks first to guide you.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 shrink-0" />
                                    Can update your profile and tasks directly.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400 shrink-0" />
                                    Strictly enforces stage-wise progression.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
