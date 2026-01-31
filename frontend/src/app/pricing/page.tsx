"use client";

import { useState } from "react";
import { Check, X, Star, Shield, Zap, Sparkles } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useStore } from "@/lib/store";

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useStore();
    const router = useRouter();

    const handleUpgrade = async () => {
        if (!user) {
            router.push("/");
            return;
        }

        const token = localStorage.getItem("token");

        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:8000/api/subscriptions/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ plan_id: isYearly ? "plan_yearly" : "plan_monthly" })
            });

            if (!res.ok) throw new Error("Failed to create subscription");
            const data = await res.json();

            if (data.mock) {
                // Mock Success
                alert("Trial Activated (Mock Mode)");
                router.push("/dashboard");
                return;
            }

            // Real Razorpay
            const options = {
                key: data.key_id,
                subscription_id: data.subscription_id,
                name: "AI Counsellor Premium",
                description: "7-Day Free Trial",
                image: "/logo.png",
                handler: async function (response: any) {
                    // Verify on success
                    await fetch("http://localhost:8000/api/subscriptions/verify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
                    alert("Subscription Activated!");
                    router.push("/dashboard");
                },
                prefill: {
                    name: user.full_name,
                    email: user.email,
                },
                theme: {
                    color: "#2563EB"
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <Navbar />

            <main className="pt-32 px-6 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Invest in Your Future
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        One acceptance letter pays for this subscription 100x over. Unlock the full power of AI-driven guidance.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isYearly ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-16 h-8 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors p-1"
                        >
                            <div
                                className={`absolute w-6 h-6 rounded-full bg-white dark:bg-blue-500 shadow-md transform transition-transform duration-300 ${isYearly ? "translate-x-8" : "translate-x-0"
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-medium ${isYearly ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                            Yearly <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
                        </span>
                    </div>
                </div>

                {/* Cards Container */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-slate-400" />
                            <h3 className="text-xl font-bold">Free Plan</h3>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">$0</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 h-12">
                            Perfect for exploring universities and starting your research.
                        </p>

                        <a href="/dashboard" className="block w-full py-3 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Continue Free
                        </a>

                        <div className="mt-8 space-y-4">
                            <FeatureItem text="Tier 1 University Data (STEM)" included={true} />
                            <FeatureItem text="Shortlist up to 3 Universities" included={true} />
                            <FeatureItem text="Basic Profile Analysis" included={true} />
                            <FeatureItem text="AI Counsellor (Text Chat)" included={true} />
                            <FeatureItem text="Tier 2 Data (MBA, Business)" included={false} />
                            <FeatureItem text="Unlimited Shortlist" included={false} />
                            <FeatureItem text="Lock & Roadmap Generation" included={false} />
                            <FeatureItem text="AI Voice Guidance" included={false} />
                        </div>
                    </div>

                    {/* Premium Plan */}
                    <div className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-500 dark:border-blue-500 shadow-2xl relative overflow-hidden transform md:-translate-y-4">

                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                            MOST POPULAR
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-blue-500" />
                            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Premium</h3>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">${isYearly ? "19" : "29"}</span>
                            <span className="text-slate-500">/mo</span>
                            {isYearly && <div className="text-sm text-green-600 mt-1">Billed $228 yearly</div>}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 h-12">
                            For ambitious students who want guaranteed admissions results.
                        </p>

                        <button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className="block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-center hover:shadow-lg hover:shadow-blue-500/25 transition transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Processing..." : "Start 7-Day Free Trial"}
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-3">Cancel anytime. No questions asked.</p>

                        <div className="mt-8 space-y-4">
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">Everything in Free, plus:</div>
                            <FeatureItem text="Full Tier 2 Data (MBA, Top Business)" included={true} highlight />
                            <FeatureItem text="Unlimited Shortlisting" included={true} highlight />
                            <FeatureItem text="Lock Universities & Generate Roadmap" included={true} highlight />
                            <FeatureItem text="Automated Task Management" included={true} highlight />
                            <FeatureItem text="AI Voice Counsellor (Coming Soon)" included={true} highlight />
                        </div>

                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-3xl pointer-events-none" />
                    </div>
                </div>
            </main>
        </div>
    );
}

function FeatureItem({ text, included, highlight = false }: { text: string; included: boolean; highlight?: boolean }) {
    return (
        <div className={`flex items-start gap-3 ${!included ? "opacity-50" : ""}`}>
            <div className={`mt-0.5 rounded-full p-0.5 ${included ? (highlight ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400") : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                {included ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-sm ${highlight ? "font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{text}</span>
        </div>
    );
}
