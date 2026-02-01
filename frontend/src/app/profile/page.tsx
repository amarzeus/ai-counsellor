"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Save, ArrowLeft, Target, Wallet, FileText, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, Profile } from "@/lib/api";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const COUNTRIES = ["USA", "UK", "Canada", "Germany", "Australia", "Netherlands", "Singapore", "Switzerland"];
const EDUCATION_LEVELS = ["High School", "Bachelor's", "Master's", "PhD"];
const DEGREES = ["Bachelor's", "Master's", "MBA", "PhD"];
const FIELDS = ["Computer Science", "Engineering", "Business", "Medicine", "Law", "Arts", "Sciences", "Economics"];
const FUNDING_OPTIONS = [
  { value: "SELF_FUNDED", label: "Self-funded" },
  { value: "SCHOLARSHIP", label: "Scholarship-dependent" },
  { value: "LOAN", label: "Loan-dependent" },
];
const EXAM_STATUS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];
const SOP_STATUS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "DRAFT", label: "Draft Ready" },
  { value: "READY", label: "Ready" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, setProfile } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    current_education_level: "",
    degree_major: "",
    graduation_year: new Date().getFullYear(),
    gpa: 3.0,
    intended_degree: "",
    field_of_study: "",
    target_intake_year: new Date().getFullYear() + 1,
    preferred_countries: [] as string[],
    budget_per_year: 40000,
    funding_plan: "",
    ielts_toefl_status: "NOT_STARTED",
    gre_gmat_status: "NOT_STARTED",
    sop_status: "NOT_STARTED",
  });

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

    fetchProfile();
  }, [router, setUser]);

  const fetchProfile = async () => {
    try {
      const response = await profileApi.get();
      const profile = response.data;
      setFormData({
        current_education_level: profile.current_education_level || "",
        degree_major: profile.degree_major || "",
        graduation_year: profile.graduation_year || new Date().getFullYear(),
        gpa: profile.gpa || 3.0,
        intended_degree: profile.intended_degree || "",
        field_of_study: profile.field_of_study || "",
        target_intake_year: profile.target_intake_year || new Date().getFullYear() + 1,
        preferred_countries: profile.preferred_countries || [],
        budget_per_year: profile.budget_per_year || 40000,
        funding_plan: profile.funding_plan || "",
        ielts_toefl_status: profile.ielts_toefl_status || "NOT_STARTED",
        gre_gmat_status: profile.gre_gmat_status || "NOT_STARTED",
        sop_status: profile.sop_status || "NOT_STARTED",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };


  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCountry = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(country)
        ? prev.preferred_countries.filter((c) => c !== country)
        : [...prev.preferred_countries, country],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await profileApi.update(formData);
      setProfile(response.data);
      toast.success("Profile updated! Recommendations recalculated.");
      router.push("/dashboard");

    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300 pb-20">

      <main className="max-w-6xl mx-auto px-6 py-6 transition-all duration-300">

        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Your Profile</h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-[10px] font-bold border border-blue-100 dark:border-blue-800 uppercase tracking-widest">
                Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Left Column */}
          <div className="space-y-6">

            {/* Academic Background */}
            <section className="bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                Academic Background
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Level</label>
                  <select
                    value={formData.current_education_level}
                    onChange={(e) => updateField("current_education_level", e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                  >
                    <option value="">Select...</option>
                    {EDUCATION_LEVELS.map((level) => (<option key={level} value={level}>{level}</option>))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GPA (4.0 Scale)</label>
                  <input
                    type="number" step="0.1" min="0" max="4"
                    value={formData.gpa}
                    onChange={(e) => updateField("gpa", parseFloat(e.target.value))}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Major / Degree</label>
                  <input
                    type="text"
                    value={formData.degree_major}
                    onChange={(e) => updateField("degree_major", e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800"
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grad Year</label>
                  <input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => updateField("graduation_year", parseInt(e.target.value))}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>
            </section>

            {/* Readiness / Exams */}
            <section className="bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <FileText className="w-4 h-4" />
                </div>
                Exam & Documents
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">IELTS / TOEFL</span>
                  <select
                    value={formData.ielts_toefl_status}
                    onChange={(e) => updateField("ielts_toefl_status", e.target.value)}
                    className="text-xs py-1 px-2 rounded-md border-0 bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {EXAM_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">GRE / GMAT</span>
                  <select
                    value={formData.gre_gmat_status}
                    onChange={(e) => updateField("gre_gmat_status", e.target.value)}
                    className="text-xs py-1 px-2 rounded-md border-0 bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {EXAM_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 group hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">SOP Status</span>
                  <select
                    value={formData.sop_status}
                    onChange={(e) => updateField("sop_status", e.target.value)}
                    className="text-xs py-1 px-2 rounded-md border-0 bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {SOP_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Study Goals */}
            <section className="bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                  <Target className="w-4 h-4" />
                </div>
                Study Goals
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Degree</label>
                  <select
                    value={formData.intended_degree}
                    onChange={(e) => updateField("intended_degree", e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                  >
                    <option value="">Select...</option>
                    {DEGREES.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Field of Study</label>
                  <select
                    value={formData.field_of_study}
                    onChange={(e) => updateField("field_of_study", e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                  >
                    <option value="">Select...</option>
                    {FIELDS.map((f) => (<option key={f} value={f}>{f}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Intake</label>
                  <input
                    type="number"
                    value={formData.target_intake_year}
                    onChange={(e) => updateField("target_intake_year", parseInt(e.target.value))}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>
            </section>

            {/* Country & Budget */}
            <section className="bg-white dark:bg-[#151b2b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                  <Wallet className="w-4 h-4" />
                </div>
                Budget & Preferences
              </h2>

              <div className="space-y-5">

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Annual Budget</label>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">${formData.budget_per_year.toLocaleString()}</span>
                  </div>
                  <input
                    type="range" min="10000" max="80000" step="5000"
                    value={formData.budget_per_year}
                    onChange={(e) => updateField("budget_per_year", parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>$10k</span>
                    <span>$80k+</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Funding Plan</label>
                  <select
                    value={formData.funding_plan}
                    onChange={(e) => updateField("funding_plan", e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                  >
                    <option value="">Select...</option>
                    {FUNDING_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Preferred Countries
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => toggleCountry(country)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all border ${formData.preferred_countries.includes(country)
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
