"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Circle, Clock, AlertCircle, Lock, Building2
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Application Tasks</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Track your progress for each locked university
          </p>
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
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Pending</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{pendingTasks.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <Circle className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">In Progress</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{inProgressTasks.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Completed</span>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{completedTasks.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Locked Universities</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {lockedUniversities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30"
                  >
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.university.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.university.country} • <span className="text-purple-600 dark:text-purple-400 font-medium">{item.category}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900">
                  <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">Pending Tasks</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-6 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleUpdateTask(task.id, "IN_PROGRESS")}
                          className="mt-1 w-5 h-5 rounded-full border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          title="Mark in progress"
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-gray-200 text-lg">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleUpdateTask(task.id, "IN_PROGRESS")}
                          className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        >
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inProgressTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">In Progress</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-gray-200">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateTask(task.id, "COMPLETED")}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-blue-500/20"
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">Completed</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-6 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      <p className="line-through text-slate-400 dark:text-slate-500">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
