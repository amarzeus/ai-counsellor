"use client";

import Link from "next/link";
import { GraduationCap, Target, CheckCircle, MessageCircle, Sparkles, ArrowRight, Globe, Users, BookOpen, Award, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-2.5 rounded-xl">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            AI Counsellor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-white/50">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-violet-200/50 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              AI-Powered Study Abroad Guidance
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Plan your journey
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                study abroad with AI
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              From confusion to clarity. Get personalized guidance through university discovery, 
              shortlisting, and application preparation.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all duration-300">
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="ml-2">500+ students guided</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Stage-Based Guidance",
                description: "Progress through structured stages: Profile Building, University Discovery, Locking, and Application Prep.",
                iconClass: "bg-gradient-to-r from-violet-500 to-purple-500",
                bgClass: "bg-gradient-to-br from-violet-50 to-purple-50",
                delay: "0s"
              },
              {
                icon: MessageCircle,
                title: "AI-Powered Decisions",
                description: "Get personalized recommendations categorized as Dream, Target, and Safe based on your profile.",
                iconClass: "bg-gradient-to-r from-blue-500 to-cyan-500",
                bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50",
                delay: "0.1s"
              },
              {
                icon: CheckCircle,
                title: "Actionable Tasks",
                description: "Receive AI-generated to-do lists for each locked university with clear deadlines and requirements.",
                iconClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
                bgClass: "bg-gradient-to-br from-emerald-50 to-teal-50",
                delay: "0.2s"
              }
            ].map((feature, idx) => (
              <Card 
                key={idx} 
                className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-2 animate-fade-in-up rounded-3xl"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`absolute inset-0 ${feature.bgClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="relative p-8">
                  <div className={`w-14 h-14 rounded-2xl ${feature.iconClass} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-violet-200/50 rounded-full">
              Simple Process
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              How It Works
            </h2>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-200 to-transparent hidden md:block" />
            
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, icon: Users, title: "Complete Profile", desc: "Share your academic background, goals & budget", iconClass: "bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-500/30" },
                { step: 2, icon: Globe, title: "Discover Universities", desc: "Get AI recommendations matched to your profile", iconClass: "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30" },
                { step: 3, icon: BookOpen, title: "Lock Your Choices", desc: "Commit to universities you want to apply to", iconClass: "bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/30" },
                { step: 4, icon: Award, title: "Prepare Applications", desc: "Follow guided tasks for each university", iconClass: "bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30" },
              ].map((item, idx) => (
                <div key={idx} className="relative text-center group">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className={`w-20 h-20 mx-auto rounded-3xl ${item.iconClass} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-3xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
            <CardContent className="relative py-16 px-8 lg:px-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Start Your Study Abroad Journey?
              </h2>
              <p className="text-lg text-violet-100 max-w-2xl mx-auto mb-8">
                Join hundreds of students who have successfully navigated their path to international education with our AI-powered guidance.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 text-lg px-10 py-6 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-xl">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">AI Counsellor</span>
            </div>
            <p className="text-gray-500 text-sm">
              Your Guided Path to Study Abroad
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-violet-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-violet-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-violet-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
