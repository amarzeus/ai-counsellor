"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle, Circle, Clock, AlertCircle, Lock, Building2
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Application Tasks</h1>
          <p className="text-gray-600 mt-1">
            Track your progress for each locked university
          </p>
        </div>

        {lockedUniversities.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Lock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Universities Locked Yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Lock at least one university to generate application tasks and start 
              preparing your documents.
            </p>
            <Link
              href="/universities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Building2 className="w-5 h-5" />
              Go to Universities
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Pending</span>
                </div>
                <p className="text-3xl font-bold">{pendingTasks.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Circle className="w-5 h-5" />
                  <span className="font-medium">In Progress</span>
                </div>
                <p className="text-3xl font-bold">{inProgressTasks.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
                <p className="text-3xl font-bold">{completedTasks.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold">Locked Universities</h2>
              </div>
              <div className="p-4 space-y-3">
                {lockedUniversities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg"
                  >
                    <Lock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">{item.university.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.university.country} • {item.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h2 className="font-semibold">Pending Tasks</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateTask(task.id, "IN_PROGRESS")}
                          className="w-6 h-6 rounded-full border-2 border-orange-400 hover:bg-orange-100 transition"
                        />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTask(task.id, "IN_PROGRESS")}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => handleUpdateTask(task.id, "COMPLETED")}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inProgressTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <Circle className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold">In Progress</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateTask(task.id, "COMPLETED")}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        Mark Complete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold">Completed</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex items-center gap-3 opacity-60"
                    >
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <p className="line-through">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">No Tasks Yet</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      Chat with your AI Counsellor to generate personalized tasks for 
                      your locked universities.
                    </p>
                    <Link
                      href="/counsellor"
                      className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
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
