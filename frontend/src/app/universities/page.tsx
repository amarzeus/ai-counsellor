"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, DollarSign, TrendingUp, Lock, Unlock, Plus, Check, X,
  Star, Target, Shield, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
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

  const handleLock = async (shortlistItem: Shortlist) => {
    try {
      await shortlistApi.lock(shortlistItem.id);
      toast.success(`${shortlistItem.university.name} locked! You can now access application guidance.`);
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniversities.map((uni) => (
              <div
                key={uni.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{uni.name}</h3>
                    <p className="text-sm text-gray-500">{uni.country}</p>
                  </div>
                  {uni.category && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoryColor(
                        uni.category
                      )}`}
                    >
                      {getCategoryIcon(uni.category)}
                      {uni.category}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>${uni.tuition_per_year?.toLocaleString()}/year</span>
                    {uni.cost_level && (
                      <span className="text-gray-400">({uni.cost_level})</span>
                    )}
                  </div>
                  
                  {uni.ranking && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span>Rank #{uni.ranking}</span>
                    </div>
                  )}
                  
                  {uni.acceptance_chance && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-gray-400" />
                      <span>Acceptance: {uni.acceptance_chance}</span>
                    </div>
                  )}
                </div>

                {uni.fit_reason && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-700">
                      <strong>Why it fits:</strong> {uni.fit_reason}
                    </p>
                  </div>
                )}

                {uni.risk_reason && (
                  <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-700 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span><strong>Risk:</strong> {uni.risk_reason}</span>
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleShortlist(uni)}
                  disabled={isShortlisted(uni.id)}
                  className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    isShortlisted(uni.id)
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isShortlisted(uni.id) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Shortlisted
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Shortlist
                    </>
                  )}
                </button>
              </div>
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
                            onClick={() => handleLock(item)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            Lock
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
    </div>
  );
}
