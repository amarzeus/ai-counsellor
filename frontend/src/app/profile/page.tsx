"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { profileApi, Profile } from "@/lib/api";
import { useStore } from "@/lib/store";
import Link from "next/link";

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
      toast.success("Profile updated! University recommendations will be recalculated.");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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

      <main className="max-w-3xl mx-auto px-4 pt-20 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">
              Update your profile to get better university recommendations
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Changing your profile will recalculate university recommendations and may affect acceptance chances.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Academic Background
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Education Level
                </label>
                <select
                  value={formData.current_education_level}
                  onChange={(e) => updateField("current_education_level", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Degree/Major
                </label>
                <input
                  type="text"
                  value={formData.degree_major}
                  onChange={(e) => updateField("degree_major", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={formData.graduation_year}
                  onChange={(e) => updateField("graduation_year", parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPA (out of 4.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => updateField("gpa", parseFloat(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Study Goals</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intended Degree
                </label>
                <select
                  value={formData.intended_degree}
                  onChange={(e) => updateField("intended_degree", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {DEGREES.map((degree) => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study
                </label>
                <select
                  value={formData.field_of_study}
                  onChange={(e) => updateField("field_of_study", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {FIELDS.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        formData.preferred_countries.includes(country)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Intake Year
                </label>
                <input
                  type="number"
                  value={formData.target_intake_year}
                  onChange={(e) => updateField("target_intake_year", parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Funding</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Per Year (USD)
                </label>
                <input
                  type="range"
                  min="10000"
                  max="80000"
                  step="5000"
                  value={formData.budget_per_year}
                  onChange={(e) => updateField("budget_per_year", parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-xl font-bold text-blue-600 mt-2">
                  ${formData.budget_per_year.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Plan
                </label>
                <select
                  value={formData.funding_plan}
                  onChange={(e) => updateField("funding_plan", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {FUNDING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam & Readiness</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IELTS/TOEFL Status
                </label>
                <select
                  value={formData.ielts_toefl_status}
                  onChange={(e) => updateField("ielts_toefl_status", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {EXAM_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GRE/GMAT Status
                </label>
                <select
                  value={formData.gre_gmat_status}
                  onChange={(e) => updateField("gre_gmat_status", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {EXAM_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SOP Status
                </label>
                <select
                  value={formData.sop_status}
                  onChange={(e) => updateField("sop_status", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SOP_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
