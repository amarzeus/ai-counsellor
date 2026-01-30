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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {dashboard?.user.full_name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{dashboard?.next_action}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Shortlisted</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">{dashboard?.shortlisted_count || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Locked</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">{dashboard?.locked_count || 0}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-gray-500 dark:text-slate-400">Pending Tasks</span>
                </div>
                <p className="text-3xl font-bold dark:text-white">{dashboard?.pending_tasks || 0}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Profile Strength</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg transition-colors">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">Academics</p>
                  <p className={`font-semibold ${dashboard?.profile_strength?.academics === "Strong"
                    ? "text-green-600 dark:text-green-400"
                    : dashboard?.profile_strength?.academics === "Weak"
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                    {dashboard?.profile_strength?.academics || "Unknown"}
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg transition-colors">
                  <Target className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">Exams</p>
                  <p className={`font-semibold ${dashboard?.profile_strength?.exams === "Completed"
                    ? "text-green-600 dark:text-green-400"
                    : dashboard?.profile_strength?.exams === "Not Started"
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                    {dashboard?.profile_strength?.exams || "Unknown"}
                  </p>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-slate-950/50 rounded-lg transition-colors">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">SOP</p>
                  <p className={`font-semibold ${dashboard?.profile_strength?.sop === "Ready"
                    ? "text-green-600 dark:text-green-400"
                    : dashboard?.profile_strength?.sop === "Not Started"
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                    }`}>
                    {dashboard?.profile_strength?.sop || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {dashboard?.current_stage === "DISCOVERY" && shortlist.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Start Exploring Universities
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-4">
                      Talk to your AI Counsellor to get personalized university recommendations based on your profile.
                    </p>
                    <Link
                      href="/counsellor"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Chat with Counsellor
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {shortlist.length > 0 && lockedUniversities.length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 transition-colors">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      Lock a University to Continue
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                      You have {shortlist.length} universities shortlisted. Lock at least one to access application guidance.
                    </p>
                    <Link
                      href="/universities"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                      View Shortlist
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {pendingTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">Pending Tasks</h3>
                  <Link href="/tasks" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {pendingTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950/50 rounded-lg transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <StageIndicator currentStage={dashboard?.current_stage || "ONBOARDING"} />

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/counsellor"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="dark:text-gray-200">Chat with AI Counsellor</span>
                </Link>
                <Link
                  href="/universities"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="dark:text-gray-200">Browse Universities</span>
                </Link>
                <Link
                  href="/tasks"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="dark:text-gray-200">View Tasks</span>
                </Link>
              </div>
            </div>

            {dashboard?.profile && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
                <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4">Profile Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Target Degree</span>
                    <span className="font-medium dark:text-gray-200">{dashboard.profile.intended_degree}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Field</span>
                    <span className="font-medium dark:text-gray-200">{dashboard.profile.field_of_study}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Budget</span>
                    <span className="font-medium dark:text-gray-200">
                      ${dashboard.profile.budget_per_year?.toLocaleString()}/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">GPA</span>
                    <span className="font-medium dark:text-gray-200">{dashboard.profile.gpa}</span>
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
