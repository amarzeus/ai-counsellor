"use client";

import Link from "next/link";
import Image from "next/image";
import { Target, CheckCircle, MessageCircle } from "lucide-react";
import Switch from "@/components/Switch";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-500">
      <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center">
                <Image
                  src="/logo.png?v=6"
                  alt="AI Counsellor"
                  width={220}
                  height={80}
                  className="h-[110px] w-auto object-contain transition-opacity group-hover:opacity-90"
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Switch />
            <div className="flex items-center gap-8">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-all hover:shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Plan your study-abroad journey
            <br />
            <span className="text-blue-600 dark:text-blue-400">with a guided AI counsellor</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            From confusion to clarity. Our AI counsellor guides you step-by-step
            through university discovery, shortlisting, and application preparation.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Start Your Journey
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Stage-Based Guidance</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Progress through structured stages: Profile Building, University Discovery,
              Locking, and Application Preparation.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">AI-Powered Decisions</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get personalized university recommendations categorized as Dream, Target,
              and Safe based on your profile.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md transition-colors duration-300">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Actionable Tasks</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive AI-generated to-do lists for each locked university with clear
              deadlines and requirements.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-16 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            {[
              { step: 1, title: "Complete Profile", desc: "Share your academic background, goals & budget" },
              { step: 2, title: "Discover Universities", desc: "Get AI recommendations matched to your profile" },
              { step: 3, title: "Lock Your Choices", desc: "Commit to universities you want to apply to" },
              { step: 4, title: "Prepare Applications", desc: "Follow guided tasks for each university" },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p>AI Counsellor - Your Guided Path to Study Abroad</p>
        </div>
      </footer>
    </div>
  );
}
