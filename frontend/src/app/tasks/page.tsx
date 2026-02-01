"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Circle, Clock, AlertCircle, Lock, Building2, Calendar, Flag
} from "lucide-react";
import toast from "react-hot-toast";
import { taskApi, shortlistApi, Task, Shortlist } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function TasksPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shortlist, setShortlist] = useState<Shortlist[]>([]);
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
      const [tasksRes, shortlistRes] = await Promise.all([
        taskApi.getAll(),
        shortlistApi.getAll(),
      ]);
      setTasks(tasksRes.data);
      setShortlist(shortlistRes.data);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: number, status: string) => {
    try {
      await taskApi.update(taskId, { status });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: status as Task["status"] } : t
        )
      );
      toast.success("Task updated!");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const lockedUniversities = shortlist.filter((s) => s.is_locked);
  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300 pb-12">
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Application Tasks</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Track your progress for each locked university
            </p>
          </div>

          {/* Header Stats */}
          {lockedUniversities.length > 0 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Locked</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-0.5">{lockedUniversities.length}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">To Do</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-0.5">{pendingTasks.length}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Circle className="w-3.5 h-3.5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-500 uppercase leading-none">Active</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-0.5">{inProgressTasks.length}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase leading-none">Done</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mt-0.5">{completedTasks.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {lockedUniversities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              No Universities Locked Yet
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              Lock at least one university to generate application tasks and start
              preparing your documents.
            </p>
            <Link
              href="/universities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-blue-500/20"
            >
              <Building2 className="w-5 h-5" />
              Go to Universities
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dashboard Stats Row Removed - Moved to Header */}

            {/* Dashboard Top Row: Locked | In Progress | Done */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

              {/* Slot 1: Locked Universities */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
                  <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Locked Universities</h2>
                  <Link href="/universities" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">Manage <div className="w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center text-[8px] text-blue-600">&rarr;</div></Link>
                </div>
                <div className="p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 dark:scrollbar-thumb-slate-800">
                  <div className="flex flex-col gap-3">
                    {lockedUniversities.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all group flex-shrink-0"
                      >
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">{item.university.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.category === 'DREAM' ? 'bg-purple-100 text-purple-700' : item.category === 'TARGET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.category}</span>
                            <span className="text-xs text-slate-400">{item.university.country}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link href="/universities" className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all group cursor-pointer flex-shrink-0">
                      <div className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-100">
                        <span className="text-xl leading-none font-light pb-0.5">+</span>
                      </div>
                      <span className="text-sm font-medium">Add University</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Slot 2: In Progress */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100/50 dark:border-blue-900/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <h3 className="font-bold text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide">In Progress</h3>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-800">{inProgressTasks.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-800">
                  {inProgressTasks.map((task, i) => (
                    <div key={task.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-all relative">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide ${i % 3 === 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {i % 3 === 0 ? 'High' : 'Normal'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">{task.title}</h4>
                      <div className="flex items-center justify-end pt-2">
                        <button onClick={() => handleUpdateTask(task.id, "COMPLETED")} className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg hover:bg-emerald-100 hover:border-emerald-200 transition-colors shadow-sm">FINISH</button>
                      </div>
                    </div>
                  ))}
                  {inProgressTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
                      <div className="w-10 h-10 bg-blue-100/50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                        <Circle className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-xs font-medium text-blue-400">No active tasks</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Slot 3: Done */}
              <div className="bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100/50 dark:border-emerald-900/20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="font-bold text-xs text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Done</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-sm border border-emerald-100 dark:border-emerald-800">{completedTasks.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-emerald-800">
                  {completedTasks.map(task => (
                    <div key={task.id} className="group bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 transition-all flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-emerald-600">
                        <CheckCircle className="w-2.5 h-2.5" />
                      </div>
                      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 line-through decoration-slate-300 truncate">{task.title}</h4>
                    </div>
                  ))}
                  {completedTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
                      <div className="w-10 h-10 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-emerald-400">Start completing!</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row: To Do List (Natural Flow) */}
            <div className="bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col mb-12">
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600"></div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">To Do List</h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{pendingTasks.length} TASKS</span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTasks.map((task, i) => (
                    <div key={task.id} className="group bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-default relative flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide ${i % 3 === 0 ? 'bg-red-50 text-red-600 border border-red-100' : i % 3 === 1 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {i % 3 === 0 ? 'High Priority' : i % 3 === 1 ? 'Medium Priority' : 'Low Priority'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300">#{task.id}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">{task.title}</h4>
                      {task.description && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{task.description}</p>}

                      <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Nov {10 + (task.id % 20)}</span>
                          </div>
                        </div>
                        <button onClick={() => handleUpdateTask(task.id, "IN_PROGRESS")} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">START TASK &rarr;</button>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <span className="text-lg font-medium text-slate-400">All tasks completed!</span>
                  </div>
                )}
              </div>
            </div>

            {tasks.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-8 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">No Tasks Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Chat with your AI Counsellor to generate personalized tasks for
                      your locked universities.
                    </p>
                    <Link
                      href="/counsellor"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition shadow-sm hover:shadow-amber-500/20"
                    >
                      Talk to AI Counsellor
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
