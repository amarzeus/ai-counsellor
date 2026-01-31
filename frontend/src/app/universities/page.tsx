"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Lock, Unlock, X,
  Star, Target, Shield
} from "lucide-react";
import toast from "react-hot-toast";
import UniversityCard from "@/components/UniversityCard";
import LockConfirmModal from "@/components/LockConfirmModal";
import UniversityDrawer from "@/components/UniversityDrawer";
import { universityApi, shortlistApi, University, Shortlist } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function UniversitiesPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [universities, setUniversities] = useState<University[]>([]);
  const [shortlist, setShortlist] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "shortlist">("all");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [selectedForLock, setSelectedForLock] = useState<Shortlist | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<Shortlist | null>(null);

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
      const [uniRes, shortlistRes] = await Promise.all([
        universityApi.getAll(),
        shortlistApi.getAll(),
      ]);
      setUniversities(uniRes.data);
      setShortlist(shortlistRes.data);
    } catch (error) {
      toast.error("Failed to load universities");
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async (university: University) => {
    try {
      const response = await shortlistApi.add({
        university_id: university.id,
        category: university.category || "TARGET",
      });
      setShortlist((prev) => [...prev, response.data]);
      toast.success(`${university.name} added to shortlist!`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to shortlist");
    }
  };

  const openLockModal = (shortlistItem: Shortlist) => {
    setSelectedForLock(shortlistItem);
    setLockModalOpen(true);
  };

  const handleLock = async () => {
    if (!selectedForLock) return;
    try {
      const response = await shortlistApi.lock(selectedForLock.id);
      fetchData();

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        storedUser.current_stage = response.data.stage;
        localStorage.setItem("user", JSON.stringify(storedUser));
        setUser(storedUser);
      }
      toast.success(response.data.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to lock university");
      throw error;
    }
  };

  const handleUnlock = async (shortlistItem: Shortlist) => {
    if (!confirm("Unlocking will remove all application tasks for this university. Continue?")) {
      return;
    }
    try {
      const response = await shortlistApi.unlock(shortlistItem.id, true);
      toast.success(`${shortlistItem.university.name} unlocked.`);
      fetchData();

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        storedUser.current_stage = response.data.stage;
        localStorage.setItem("user", JSON.stringify(storedUser));
        setUser(storedUser);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to unlock");
    }
  };

  const handleRemove = async (shortlistItem: Shortlist) => {
    try {
      await shortlistApi.removeByUniversityId(shortlistItem.university_id);
      setShortlist((prev) => prev.filter((s) => s.id !== shortlistItem.id));
      toast.success("Removed from shortlist");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove");
    }
  };

  const handleRemoveByUniversityId = async (universityId: number) => {
    try {
      await shortlistApi.removeByUniversityId(universityId);
      setShortlist((prev) => prev.filter((s) => s.university_id !== universityId));
      toast.success("Removed from shortlist");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove");
    }
  };

  const isShortlisted = (uniId: number) => {
    return shortlist.some((s) => s.university_id === uniId);
  };

  const getShortlistItem = (uniId: number) => {
    return shortlist.find((s) => s.university_id === uniId);
  };

  const openDrawer = (item: Shortlist) => {
    setSelectedUniversity(item);
    setDrawerOpen(true);
  };

  const openDrawerForUniversity = (uni: University) => {
    const item = getShortlistItem(uni.id);
    if (item) {
      openDrawer(item);
    } else {
      // Create mock shortlist item for viewing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockItem: any = {
        id: -1,
        university_id: uni.id,
        university: uni,
        category: uni.category || "TARGET",
        is_locked: false,
      };
      openDrawer(mockItem);
    }
  };

  const handleDrawerLock = async (id: number) => {
    try {
      const response = await shortlistApi.lock(id);
      toast.success(response.data.message);
      setDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to lock");
    }
  };

  const handleDrawerUnlock = async (id: number) => {
    try {
      await shortlistApi.unlock(id, true);
      toast.success("University unlocked");
      setDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to unlock");
    }
  };

  const handleDrawerRemove = async (id: number) => {
    // Get the university_id from the selected university
    const uniId = selectedUniversity?.university_id;
    if (!uniId) return;
    try {
      await shortlistApi.removeByUniversityId(uniId);
      toast.success("Removed from shortlist");
      setDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DREAM":
        return <Star className="w-4 h-4" />;
      case "TARGET":
        return <Target className="w-4 h-4" />;
      case "SAFE":
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "DREAM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "TARGET":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SAFE":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const countries = [...new Set(universities.map((u) => u.country))];
  const filteredUniversities = countryFilter
    ? universities.filter((u) => u.country === countryFilter)
    : universities;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Universities</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Discover and compare top programs tailored to your profile.
            </p>
          </div>

          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "all"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              All Universities
            </button>
            <button
              onClick={() => setActiveTab("shortlist")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === "shortlist"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
            >
              Shortlist ({shortlist.length})
            </button>
          </div>
        </div>

        {activeTab === "all" && (
          <div className="mb-8">
            <div className="relative max-w-xs">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 shadow-sm text-sm appearance-none cursor-pointer hover:border-blue-500/30 transition-colors"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        )}

        {activeTab === "all" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUniversities.map((uni) => (
              <UniversityCard
                key={uni.id}
                university={uni}
                index={uni.id}
                isShortlisted={isShortlisted(uni.id)}
                onShortlist={() => isShortlisted(uni.id) ? handleRemoveByUniversityId(uni.id) : handleShortlist(uni)}
                onClick={() => openDrawerForUniversity(uni)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {shortlist.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Your shortlist is empty
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                  Browse our curated list of universities and save your favorites to compare and track.
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition shadow-sm hover:shadow-blue-500/20"
                >
                  Browse Universities
                </button>
              </div>
            ) : (
              shortlist.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border transition-all ${item.is_locked
                    ? "border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div
                      className="flex items-start gap-5 cursor-pointer flex-1"
                      onClick={() => openDrawer(item)}
                    >
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {item.university.name}
                          </h3>
                          {item.is_locked && (
                            <span className="px-2.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold tracking-wide uppercase rounded-full flex items-center gap-1 shadow-sm">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {item.university.country} <span className="mx-1.5 text-slate-300">•</span> ${item.university.tuition_per_year?.toLocaleString()}/year
                        </p>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.is_locked ? (
                        <button
                          onClick={() => handleUnlock(item)}
                          className="px-4 py-2 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-500 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2 transition-colors text-sm font-medium"
                        >
                          <Unlock className="w-4 h-4" />
                          Unlock
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openLockModal(item)}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 shadow-sm font-medium transition-all text-sm"
                          >
                            <Lock className="w-4 h-4" />
                            Lock
                          </button>
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            title="Remove from Shortlist"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {shortlist.length > 0 && !shortlist.some((s) => s.is_locked) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6 flex gap-4 items-start">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-500 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Lock a University</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Lock at least one university to access application guidance and generate tasks.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <LockConfirmModal
        universityName={selectedForLock?.university.name || ""}
        isOpen={lockModalOpen}
        onClose={() => {
          setLockModalOpen(false);
          setSelectedForLock(null);
        }}
        onConfirm={handleLock}
      />

      <UniversityDrawer
        university={selectedUniversity}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLock={handleDrawerLock}
        onUnlock={handleDrawerUnlock}
        onRemove={handleDrawerRemove}
        onShortlist={handleShortlist}
      />
    </div>
  );
}
