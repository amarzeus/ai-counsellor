"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Lock, Unlock, X,
  Star, Target, Shield
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import UniversityCard from "@/components/UniversityCard";
import LockConfirmModal from "@/components/LockConfirmModal";
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
      await shortlistApi.lock(selectedForLock.id);
      fetchData();
      
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        storedUser.current_stage = "APPLICATION";
        localStorage.setItem("user", JSON.stringify(storedUser));
        setUser(storedUser);
      }
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
      await shortlistApi.unlock(shortlistItem.id);
      toast.success(`${shortlistItem.university.name} unlocked.`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to unlock");
    }
  };

  const handleRemove = async (shortlistItem: Shortlist) => {
    if (!confirm("Remove this university from your shortlist?")) {
      return;
    }
    try {
      await shortlistApi.remove(shortlistItem.id);
      setShortlist((prev) => prev.filter((s) => s.id !== shortlistItem.id));
      toast.success("Removed from shortlist");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to remove");
    }
  };

  const isShortlisted = (uniId: number) => {
    return shortlist.some((s) => s.university_id === uniId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Universities</h1>
            <p className="text-gray-600 mt-1">
              Discover and shortlist universities that match your profile
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              All Universities
            </button>
            <button
              onClick={() => setActiveTab("shortlist")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "shortlist"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              My Shortlist ({shortlist.length})
            </button>
          </div>
        </div>

        {activeTab === "all" && (
          <div className="mb-6">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "all" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map((uni) => (
              <UniversityCard
                key={uni.id}
                university={uni}
                isShortlisted={isShortlisted(uni.id)}
                onShortlist={() => handleShortlist(uni)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {shortlist.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No universities shortlisted yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Browse universities and add them to your shortlist to compare
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Universities
                </button>
              </div>
            ) : (
              shortlist.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border ${
                    item.is_locked ? "border-purple-300 bg-purple-50" : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {item.university.name}
                          </h3>
                          {item.is_locked && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {item.university.country} • ${item.university.tuition_per_year?.toLocaleString()}/year
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Category: {item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {item.is_locked ? (
                        <button
                          onClick={() => handleUnlock(item)}
                          className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          Unlock
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openLockModal(item)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg shadow-purple-500/30 font-semibold transition-all hover:scale-105"
                          >
                            <Lock className="w-4 h-4" />
                            Lock University
                          </button>
                          <button
                            onClick={() => handleRemove(item)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Next Step:</strong> Lock at least one university to access application guidance and generate tasks.
                </p>
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
    </div>
  );
}
