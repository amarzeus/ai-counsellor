"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Target, CheckCircle, Clock,
  MessageCircle, Building2, Lock, ArrowRight, ListTodo,
  Pencil, DollarSign, MapPin, Award, Lightbulb, ChevronRight, Mail
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import StageIndicator from "@/components/StageIndicator";
import UniversityDrawer from "@/components/UniversityDrawer";
import { dashboardApi, shortlistApi, taskApi, Dashboard, Shortlist, Task } from "@/lib/api";
import { useStore } from "@/lib/store";
import { TimelineView } from "@/components/timeline-view";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, setDashboard, setShortlist, setTasks } = useStore();
  const [dashboard, setLocalDashboard] = useState<Dashboard | null>(null);
  const [shortlist, setLocalShortlist] = useState<Shortlist[]>([]);
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState<Shortlist | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      if (dashRes.data.user) {
        setUser(dashRes.data.user);
        localStorage.setItem("user", JSON.stringify(dashRes.data.user));
      }
      setShortlist(shortlistRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async (id: number) => {
    try {
      await shortlistApi.lock(id);
      toast.success("University locked!");
      setDrawerOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to lock university");
    }
  };

  const handleUnlock = async (id: number) => {
    try {
      await shortlistApi.unlock(id, true);
      toast.success("University unlocked");
      setDrawerOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to unlock university");
    }
  };

  const handleRemove = async (id: number) => {
    // Get the university_id from the selected university
    const uniId = selectedUniversity?.university_id;
    if (!uniId) return;
    try {
      await shortlistApi.removeByUniversityId(uniId);
      toast.success("Removed from shortlist");
      setDrawerOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to remove university");
    }
  };

  const openDrawer = (item: Shortlist) => {
    setSelectedUniversity(item);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#0B1120]">
        <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col">
          {/* Header Skeleton */}
          <div className="flex items-baseline justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="hidden md:block h-4 w-96" />
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <Skeleton className="flex-1 rounded-xl" />
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="flex-1 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const lockedUniversities = shortlist.filter((s) => s.is_locked);
  const showLockReminder = shortlist.length > 0 && lockedUniversities.length === 0;

  const getGuidanceContent = () => {
    if (shortlist.length === 0) {
      return {
        title: "What happens next?",
        description: "Chat with your AI Counsellor to get personalized university recommendations based on your profile.",
        action: "Start Exploring",
        href: "/counsellor"
      };
    }
    if (lockedUniversities.length === 0) {
      return {
        title: "Next step: Lock a university",
        description: "Review your shortlist and lock at least one university to unlock application guidance and timelines.",
        action: "View Shortlist",
        href: "/universities"
      };
    }
    return null;
  };

  const guidance = getGuidanceContent();
  const countries = dashboard?.profile?.preferred_countries || [];

  const categoryColors = {
    DREAM: "bg-purple-500",
    TARGET: "bg-blue-500",
    SAFE: "bg-emerald-500",
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#0B1120]">
      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col">
        {/* Header Row */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome back, {dashboard?.user.full_name?.split(" ")[0]}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {dashboard?.next_action || "Ready to continue your journey?"}
            </p>
          </div>
          {dashboard?.profile && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{dashboard.profile.intended_degree}</span>
              <span>•</span>
              <span>{dashboard.profile.field_of_study}</span>
              <span>•</span>
              <span>${dashboard.profile.budget_per_year?.toLocaleString()}/yr</span>
              <span>•</span>
              <span>GPA {dashboard.profile.gpa}</span>
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Row 1: Stats + Profile Strength */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center h-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                  <div className="text-center px-4 py-4 sm:py-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-500 opacity-70" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Shortlisted</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{dashboard?.shortlisted_count || 0}</p>
                  </div>
                  <div className="text-center px-4 py-4 sm:py-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-purple-500 opacity-70" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Locked</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{dashboard?.locked_count || 0}</p>
                  </div>
                  <div className="text-center px-4 py-4 sm:py-0">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-500 opacity-70" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{dashboard?.pending_tasks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Profile Strength</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${dashboard?.profile_strength?.academics === "Strong"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : dashboard?.profile_strength?.academics === "Weak"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                    Academics: {dashboard?.profile_strength?.academics || "—"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${dashboard?.profile_strength?.exams === "Completed"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : dashboard?.profile_strength?.exams === "Not Started"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                    Exams: {dashboard?.profile_strength?.exams || "—"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${dashboard?.profile_strength?.sop === "Ready"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : dashboard?.profile_strength?.sop === "Not Started"
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                    SOP: {dashboard?.profile_strength?.sop || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Deadline Timeline */}
            <div className="mb-1">
              <TimelineView />
            </div>

            {/* Lock Reminder */}
            {showLockReminder && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                  {shortlist.length} shortlisted — lock one to proceed
                </span>
                <button
                  onClick={() => router.push('/universities')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  View Shortlist
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Row 2: Quick Actions + Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="space-y-1">
                  <Link href="/counsellor" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Chat with AI Counsellor</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </Link>
                  <Link href="/universities" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Browse Universities</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </Link>
                  <Link href="/tasks" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <ListTodo className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">View Tasks</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </Link>
                  <Link href="/tools/cold-email" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Architect</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Profile Summary</h3>
                  <Link href="/profile" className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                </div>
                {dashboard?.profile && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Degree / Field</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{dashboard.profile.intended_degree}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{dashboard.profile.field_of_study}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Budget</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">${dashboard.profile.budget_per_year?.toLocaleString()}/yr</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">GPA</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{dashboard.profile.gpa}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Countries</p>
                      {countries.length > 0 ? (
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{countries.slice(0, 2).join(", ")}{countries.length > 2 ? ` +${countries.length - 2}` : ""}</p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Not set — <Link href="/profile" className="text-blue-500 hover:underline">add preferences</Link></p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Journey - Now compact horizontal */}
            <StageIndicator currentStage={dashboard?.current_stage || "ONBOARDING"} />

            {/* Universities Card - Now the primary block */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 lg:flex-1 lg:min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Your Universities</h3>
                <Link href="/universities" className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</Link>
              </div>

              {shortlist.length > 0 ? (
                <div className="space-y-2 flex-1">
                  {shortlist.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openDrawer(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-left border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${categoryColors[item.category]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.university.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">{item.university.country}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[10px] text-slate-400">${item.university.tuition_per_year?.toLocaleString()}/yr</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className={`text-[10px] font-medium ${item.category === "DREAM" ? "text-purple-600 dark:text-purple-400" :
                            item.category === "TARGET" ? "text-blue-600 dark:text-blue-400" :
                              "text-emerald-600 dark:text-emerald-400"
                            }`}>{item.category}</span>
                        </div>
                      </div>
                      {item.is_locked && (
                        <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                  {shortlist.length > 4 && (
                    <Link
                      href="/universities"
                      className="block mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      +{shortlist.length - 4} more universities
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No universities yet</p>
                  <button
                    onClick={() => router.push('/counsellor')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Recommendations
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Row 3: Tasks OR Guidance */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 lg:flex-1 lg:min-h-0">
              {tasks.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tasks Overview</h3>
                    <Link href="/tasks" className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</Link>
                  </div>
                  <div className="space-y-1.5">
                    {pendingTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-slate-50/80 dark:bg-slate-800/30 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{task.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Pending</span>
                      </div>
                    ))}
                    {completedTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex-1 truncate line-through">{task.title}</span>
                        <span className="text-[10px] text-emerald-600 uppercase">Done</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : guidance ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Lightbulb className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{guidance.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{guidance.description}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => router.push(guidance.href)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors"
                    >
                      {guidance.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">All caught up! Check your tasks.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* University Detail Drawer */}
      <UniversityDrawer
        university={selectedUniversity}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onRemove={handleRemove}
      />
    </div>
  );
}
