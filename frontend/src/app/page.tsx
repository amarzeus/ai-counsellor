"use client";

import Link from "next/link";
import Image from "next/image";
import { Target, CheckCircle, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Image src="/logo.png?v=5" alt="AI Counsellor" width={150} height={50} className="h-12 w-auto" unoptimized />
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plan your study-abroad journey
            <br />
            <span className="text-blue-600">with a guided AI counsellor</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
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
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stage-Based Guidance</h3>
            <p className="text-gray-600">
              Progress through structured stages: Profile Building, University Discovery,
              Locking, and Application Preparation.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Decisions</h3>
            <p className="text-gray-600">
              Get personalized university recommendations categorized as Dream, Target,
              and Safe based on your profile.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Actionable Tasks</h3>
            <p className="text-gray-600">
              Receive AI-generated to-do lists for each locked university with clear
              deadlines and requirements.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
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
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p>AI Counsellor - Your Guided Path to Study Abroad</p>
        </div>
      </footer>
    </div>
  );
}
