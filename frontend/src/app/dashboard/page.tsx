"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Target, CheckCircle, Clock, AlertCircle,
  MessageCircle, Building2, Lock, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import StageIndicator from "@/components/StageIndicator";
import { dashboardApi, shortlistApi, taskApi, Dashboard, Shortlist, Task } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, setDashboard, setShortlist, setTasks } = useStore();
  const [dashboard, setLocalDashboard] = useState<Dashboard | null>(null);
  const [shortlist, setLocalShortlist] = useState<Shortlist[]>([]);
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const storedUser = JSON.parse(userStr);
      setUser(storedUser);

      if (!storedUser.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
    }

    fetchData();
  }, [router, setUser]);

  const fetchData = async () => {
    try {
      const [dashRes, shortlistRes, tasksRes] = await Promise.all([
        dashboardApi.get(),
        shortlistApi.getAll(),
        taskApi.getAll(),
      ]);

      setLocalDashboard(dashRes.data);
      setLocalShortlist(shortlistRes.data);
      setLocalTasks(tasksRes.data);

      setDashboard(dashRes.data);
      setShortlist(shortlistRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const lockedUniversities = shortlist.filter((s) => s.is_locked);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Welcome back, {dashboard?.user.full_name?.split(" ")[0]}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {dashboard?.next_action || "Ready to continue your journey?"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Shortlisted</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{dashboard?.shortlisted_count || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Locked</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{dashboard?.locked_count || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-orange-500/30 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{dashboard?.pending_tasks || 0}</p>
              </div>
            </div>

            {/* Profile Strength */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white tracking-tight">Profile Strength</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <GraduationCap className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Academics</p>
                  <p className={`text-lg font-bold ${dashboard?.profile_strength?.academics === "Strong"
                    ? "text-green-600 dark:text-green-400"
                    : dashboard?.profile_strength?.academics === "Weak"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                    }`}>
                    {dashboard?.profile_strength?.academics || "Unknown"}
                  </p>
                </div>

                <div className="text-center p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <Target className="w-8 h-8 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Exams</p>
                  <p className={`text-lg font-bold ${dashboard?.profile_strength?.exams === "Completed"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : dashboard?.profile_strength?.exams === "Not Started"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                    }`}>
                    {dashboard?.profile_strength?.exams || "Unknown"}
                  </p>
                </div>

                <div className="text-center p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">SOP</p>
                  <p className={`text-lg font-bold ${dashboard?.profile_strength?.sop === "Ready"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : dashboard?.profile_strength?.sop === "Not Started"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                    }`}>
                    {dashboard?.profile_strength?.sop || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            {dashboard?.current_stage === "DISCOVERY" && shortlist.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-8 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/counsellor')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-start gap-6 relative z-10">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Start Exploring Universities
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      Talk to your AI Counsellor to get personalized university recommendations based on your profile.
                    </p>
                    <button
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      Chat with Counsellor
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {shortlist.length > 0 && lockedUniversities.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-8 relative overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/universities')}>
                <div className="flex items-start gap-6">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Lock a University
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      You have {shortlist.length} universities shortlisted. Lock at least one to access application guidance.
                    </p>
                    <button
                      className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition hover:shadow-lg hover:shadow-amber-600/20"
                    >
                      View Shortlist
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            {pendingTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Pending Tasks</h3>
                  <Link href="/tasks" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {pendingTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <StageIndicator currentStage={dashboard?.current_stage || "ONBOARDING"} />

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/counsellor"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Chat with AI</span>
                </Link>
                <Link
                  href="/universities"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Browse Universities</span>
                </Link>
                <Link
                  href="/tasks"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">View Tasks</span>
                </Link>
              </div>
            </div>

            {dashboard?.profile && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Profile Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">Target Degree</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{dashboard.profile.intended_degree}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">Field</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{dashboard.profile.field_of_study}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">Budget</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${dashboard.profile.budget_per_year?.toLocaleString()}/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500 dark:text-slate-400">GPA</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{dashboard.profile.gpa}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
