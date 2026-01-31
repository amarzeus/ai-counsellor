"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-blue-600 transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Left Column: Info */}
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">
                            Get in touch
                        </h1>
                        <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                            Have questions about the platform, feedback to share, or need help with your account? We'd love to hear from you.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900 mb-1">Email us</h3>
                                    <p className="text-neutral-500 text-sm mb-2">For general support and inquiries</p>
                                    <a href="mailto:amarmahakal92@gmail.com" className="text-blue-600 font-medium hover:underline">
                                        amarmahakal92@gmail.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900 mb-1">Feedback</h3>
                                    <p className="text-neutral-500 text-sm mb-2">Tell us how we can improve</p>
                                    <p className="text-neutral-700">
                                        We value your input to make AI Counsellor better for everyone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Contact Card */}
                    <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

                        <h2 className="text-xl font-bold text-neutral-900 mb-6">Send us a message</h2>

                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="first-name" className="text-sm font-medium text-neutral-700">First name</label>
                                    <input
                                        type="text"
                                        id="first-name"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="last-name" className="text-sm font-medium text-neutral-700">Last name</label>
                                    <input
                                        type="text"
                                        id="last-name"
                                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="jane@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-neutral-700">Message</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors shadow-sm"
                                onClick={() => {
                                    window.location.href = "mailto:amarmahakal92@gmail.com";
                                }}
                            >
                                Send Message
                            </button>
                            <p className="text-xs text-center text-neutral-400 mt-4">
                                This manual form is disabled. Clicking send will open your email client.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
