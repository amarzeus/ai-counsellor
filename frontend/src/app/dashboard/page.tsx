"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Target, CheckCircle, Clock,
  MessageCircle, Building2, Lock, ArrowRight, ListTodo,
  Pencil, DollarSign, MapPin, Award, Lightbulb
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const lockedUniversities = shortlist.filter((s) => s.is_locked);
  const showLockReminder = shortlist.length > 0 && lockedUniversities.length === 0;

  // State-aware guidance content
  const getGuidanceContent = () => {
    if (shortlist.length === 0) {
      return {
        icon: MessageCircle,
        title: "What happens next?",
        description: "Chat with your AI Counsellor to get personalized university recommendations based on your profile, budget, and goals.",
        action: "Start Exploring",
        href: "/counsellor",
        color: "blue"
      };
    }
    if (lockedUniversities.length === 0) {
      return {
        icon: Lock,
        title: "Next step: Lock a university",
        description: "Review your shortlist and lock at least one university to unlock application guidance, timelines, and document checklists.",
        action: "View Shortlist",
        href: "/universities",
        color: "amber"
      };
    }
    return null; // No guidance needed once universities are locked
  };

  const guidance = getGuidanceContent();

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#0B1120] overflow-hidden">
      <main className="max-w-7xl mx-auto px-6 py-4 h-full flex flex-col">
        {/* Header Row */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome back, {dashboard?.user.full_name?.split(" ")[0]}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dashboard?.next_action || "Ready to continue your journey?"}
            </p>
          </div>
          {dashboard?.profile && (
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{dashboard.profile.intended_degree}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>{dashboard.profile.field_of_study}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>${dashboard.profile.budget_per_year?.toLocaleString()}/yr</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>GPA {dashboard.profile.gpa}</span>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Row 1: KPIs + Profile Strength */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase">Shortlisted</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard?.shortlisted_count || 0}</p>
                  </div>
                  <div className="text-center border-x border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Lock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase">Locked</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard?.locked_count || 0}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboard?.pending_tasks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Profile Strength</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-blue-600/60 dark:text-blue-400/60" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Academics:</span>
                    <span className={`text-[10px] font-semibold ${dashboard?.profile_strength?.academics === "Strong" ? "text-green-600" : dashboard?.profile_strength?.academics === "Weak" ? "text-red-600" : "text-amber-600"}`}>
                      {dashboard?.profile_strength?.academics || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-600/60 dark:text-emerald-400/60" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Exams:</span>
                    <span className={`text-[10px] font-semibold ${dashboard?.profile_strength?.exams === "Completed" ? "text-emerald-600" : dashboard?.profile_strength?.exams === "Not Started" ? "text-red-600" : "text-amber-600"}`}>
                      {dashboard?.profile_strength?.exams || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-purple-600/60 dark:text-purple-400/60" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">SOP:</span>
                    <span className={`text-[10px] font-semibold ${dashboard?.profile_strength?.sop === "Ready" ? "text-emerald-600" : dashboard?.profile_strength?.sop === "Not Started" ? "text-red-600" : "text-amber-600"}`}>
                      {dashboard?.profile_strength?.sop || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock Reminder Banner */}
            {showLockReminder && (
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">
                  {shortlist.length} shortlisted — lock one to proceed to applications
                </span>
                <button
                  onClick={() => router.push('/universities')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition whitespace-nowrap"
                >
                  View Shortlist
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Row 2: Quick Actions + Profile Summary (Redesigned) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Quick Actions</h3>
                <div className="space-y-1">
                  <Link href="/counsellor" className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-600/70 dark:text-blue-400/70" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600">Chat with AI Counsellor</span>
                  </Link>
                  <Link href="/universities" className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                    <Building2 className="w-3.5 h-3.5 text-purple-600/70 dark:text-purple-400/70" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-purple-600">Browse Universities</span>
                  </Link>
                  <Link href="/tasks" className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                    <ListTodo className="w-3.5 h-3.5 text-green-600/70 dark:text-green-400/70" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-green-600">View Tasks</span>
                  </Link>
                </div>
              </div>

              {/* Profile Summary - Redesigned */}
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Profile Summary</h3>
                  <Link href="/profile" className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                    <Pencil className="w-2.5 h-2.5" />
                    Edit
                  </Link>
                </div>
                {dashboard?.profile && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-start gap-1.5">
                      <GraduationCap className="w-3 h-3 text-slate-400/70 mt-0.5" />
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Degree / Field</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{dashboard.profile.intended_degree}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">{dashboard.profile.field_of_study}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <DollarSign className="w-3 h-3 text-slate-400/70 mt-0.5" />
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Budget</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">${dashboard.profile.budget_per_year?.toLocaleString()}/yr</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Award className="w-3 h-3 text-slate-400/70 mt-0.5" />
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">GPA</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{dashboard.profile.gpa}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400/70 mt-0.5" />
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Countries</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-white">{dashboard.profile.target_countries?.slice(0, 2).join(", ") || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Tasks OR State-Aware Guidance */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-800 flex-1 min-h-0">
              {tasks.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Tasks Overview</h3>
                    <Link href="/tasks" className="text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</Link>
                  </div>
                  <div className="space-y-1">
                    {pendingTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">{task.title}</span>
                        <span className="text-[9px] text-slate-400 uppercase">Pending</span>
                      </div>
                    ))}
                    {completedTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded">
                        <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate line-through">{task.title}</span>
                        <span className="text-[9px] text-emerald-600 uppercase">Done</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : guidance ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${guidance.color === "blue" ? "bg-blue-50 dark:bg-blue-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                      <Lightbulb className={`w-4 h-4 ${guidance.color === "blue" ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{guidance.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{guidance.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => router.push(guidance.href)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${guidance.color === "blue"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                    >
                      {guidance.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-slate-400 dark:text-slate-500">All caught up! Check your tasks for next steps.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4">
            <StageIndicator currentStage={dashboard?.current_stage || "ONBOARDING"} />
          </div>
        </div>
      </main>
    </div>
  );
}
