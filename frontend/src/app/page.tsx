"use client";

import Link from "next/link";
import { Target, CheckCircle, MessageCircle } from "lucide-react";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">
      {/* Background Enhancements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-50/40 dark:bg-indigo-900/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      <main className="max-w-7xl mx-auto px-8 py-16 relative">
        <div className="text-center mb-24 relative">
          {/* Hero Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-200/20 to-indigo-200/20 dark:from-blue-500/10 dark:to-indigo-500/10 blur-3xl rounded-full -z-10" />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            Plan your study-abroad journey
            <br />
            <span className="text-blue-600 dark:text-blue-400">with a guided AI counsellor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            From confusion to clarity. Our AI counsellor guides you step-by-step
            through university discovery, shortlisting, and application preparation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5 active:scale-95"
            >
              Start Your Journey
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-3 gap-8 mb-24"
        >
          <motion.div
            variants={item}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300"
          >
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Stage-Based Guidance</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Progress through structured stages: Profile Building, University Discovery,
              Locking, and Application Preparation.
            </p>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300"
          >
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">AI-Powered Decisions</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Get personalized university recommendations categorized as Dream, Target,
              and Safe based on your profile.
            </p>
          </motion.div>

          <motion.div
            variants={item}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300"
          >
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Actionable Tasks</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Receive AI-generated to-do lists for each locked university with clear
              deadlines and requirements.
            </p>
          </motion.div>
        </motion.div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-10 mb-16 transition-colors duration-300 relative overflow-hidden">
          {/* Section Background Decor */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50/50 to-white/0 dark:from-slate-800/20 dark:to-slate-900/0 pointer-events-none" />

          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 dark:text-white relative z-10">How It Works</h2>

          <div className="relative z-10">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-[24px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40" />

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, title: "Complete Profile", desc: "Share your academic background & goals." },
                { step: 2, title: "Discover Universities", desc: "Get AI-curated Dream, Target & Safe schools." },
                { step: 3, title: "Lock Your Choices", desc: "Select and commit to your top universities." },
                { step: 4, title: "Prepare Applications", desc: "Follow guided tasks to hit every deadline." },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Step Indicator */}
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-50 dark:border-blue-900/30 flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/10 group-hover:scale-110 group-hover:border-blue-100 dark:group-hover:border-blue-500/50 transition-all duration-300">
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 font-extrabold text-lg">{item.step}</span>
                    {/* Active Halo */}
                    <div className="absolute inset-0 rounded-full border border-blue-100 dark:border-blue-500/20 scale-125 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                  </div>

                  {/* Content */}
                  <h4 className="font-bold text-lg mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[200px]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 text-gray-500 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p>AI Counsellor - Your Guided Path to Study Abroad</p>
        </div>
      </footer>
    </div>
  );
}
