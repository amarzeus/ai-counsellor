"use client";

import Link from "next/link";
import { GraduationCap, Target, CheckCircle, MessageCircle } from "lucide-react";
import ScrollHero from "@/components/ScrollHero";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold text-white">AI Counsellor</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <ScrollHero />

      <main className="relative z-10 bg-gray-950">
        <div className="max-w-7xl mx-auto px-8 py-24">
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <div className="bg-gray-900/80 backdrop-blur p-8 rounded-2xl border border-gray-800">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Stage-Based Guidance</h3>
              <p className="text-gray-400">
                Progress through structured stages: Profile Building, University Discovery,
                Locking, and Application Preparation.
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur p-8 rounded-2xl border border-gray-800">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Decisions</h3>
              <p className="text-gray-400">
                Get personalized university recommendations categorized as Dream, Target,
                and Safe based on your profile.
              </p>
            </div>

            <div className="bg-gray-900/80 backdrop-blur p-8 rounded-2xl border border-gray-800">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Actionable Tasks</h3>
              <p className="text-gray-400">
                Receive AI-generated to-do lists for each locked university with clear
                deadlines and requirements.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700">
            <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              {[
                { step: 1, title: "Complete Profile", desc: "Share your academic background, goals & budget" },
                { step: 2, title: "Discover Universities", desc: "Get AI recommendations matched to your profile" },
                { step: 3, title: "Lock Your Choices", desc: "Commit to universities you want to apply to" },
                { step: 4, title: "Prepare Applications", desc: "Follow guided tasks for each university" },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg shadow-blue-500/30">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black text-gray-500 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p>AI Counsellor - Your Guided Path to Study Abroad</p>
        </div>
      </footer>
    </div>
  );
}
