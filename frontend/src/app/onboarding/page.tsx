"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, ChevronRight, ChevronLeft, Check } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi } from "@/lib/api";
import { useStore } from "@/lib/store";

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

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser, setProfile } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current_education_level: "",
    degree_major: "",
    graduation_year: new Date().getFullYear(),
    gpa: 3.0,
    gpa_scale: 4, // Default to 4.0 scale
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
    }
  }, [router]);


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

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.current_education_level &&
          formData.degree_major &&
          isValidYear(formData.graduation_year) &&
          isValidGPA(formData.gpa);
      case 2:
        return formData.intended_degree &&
          formData.field_of_study &&
          formData.preferred_countries.length > 0 &&
          isValidIntakeYear(formData.target_intake_year);
      case 3:
        return formData.budget_per_year && formData.funding_plan;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Normalize GPA to 4.0 scale if 10.0 scale is selected
      const payload = { ...formData };
      if (formData.gpa_scale === 10) {
        payload.gpa = parseFloat(((formData.gpa / 10) * 4).toFixed(2));
      }

      await profileApi.update(payload);
      const response = await profileApi.completeOnboarding();

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.onboarding_completed = true;
        user.current_stage = response.data.stage;
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
      }

      toast.success("Profile complete! Welcome to your dashboard.");
      router.push("/dashboard");

    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const isValidYear = (year: number) => {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  };

  const isValidIntakeYear = (year: number) => {
    const currentYear = new Date().getFullYear();
    // Intake should be current year or future (up to 10 years)
    return year >= currentYear && year <= currentYear + 10;
  };

  const isValidGPA = (gpa: number) => {
    if (formData.gpa_scale === 10) {
      return gpa >= 0 && gpa <= 10.0;
    }
    return gpa >= 0 && gpa <= 4.0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <nav className="flex-none flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src="/logo.png?v=6"
              alt="AI Counsellor"
              width={180}
              height={60}
              className="h-12 w-auto object-contain"
              unoptimized
            />
          </Link>
        </div>
        <div className="text-sm text-gray-600">Step {step} of 4</div>
      </nav>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto px-4 py-4 w-full">
        <div className="flex justify-between mb-2 flex-none">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center ${s < 4 ? "flex-1" : ""}`}
            >
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-medium text-sm md:text-base ${s < step
                  ? "bg-green-500 text-white"
                  : s === step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
              >
                {s < step ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${s < step ? "bg-green-500" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex-1 flex flex-col overflow-y-auto max-h-[78vh]">
          <div className="flex-1 space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">Academic Background</h2>
                <p className="text-gray-600">Tell us about your educational background</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Education Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EDUCATION_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => updateField("current_education_level", level)}
                        className={`p-3 rounded-lg border text-left text-sm md:text-base ${formData.current_education_level === level
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-900 bg-white"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.graduation_year}
                      onChange={(e) => updateField("graduation_year", parseInt(e.target.value))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isValidYear(formData.graduation_year)
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {!isValidYear(formData.graduation_year) && (
                      <p className="text-xs text-red-500 mt-1">Please enter a valid year (1900-{new Date().getFullYear()})</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">GPA Scale</label>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        {[4, 10].map((scale) => (
                          <button
                            key={scale}
                            onClick={() => updateField("gpa_scale", scale)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${formData.gpa_scale === scale
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                              }`}
                          >
                            {scale}.0
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="block text-xs text-gray-500 mb-2">
                      Enter your GPA out of {formData.gpa_scale}.0
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={formData.gpa_scale}
                      value={formData.gpa}
                      onChange={(e) => updateField("gpa", parseFloat(e.target.value))}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isValidGPA(formData.gpa)
                        ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {!isValidGPA(formData.gpa) && (
                      <p className="text-xs text-red-500 mt-1">GPA must be between 0.0 and {formData.gpa_scale}.0</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">Study Goals</h2>
                <p className="text-gray-600">What do you want to pursue?</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intended Degree
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEGREES.map((degree) => (
                      <button
                        key={degree}
                        onClick={() => updateField("intended_degree", degree)}
                        className={`p-3 rounded-lg border text-left text-sm md:text-base ${formData.intended_degree === degree
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-900 bg-white"
                          }`}
                      >
                        {degree}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELDS.map((field) => (
                      <button
                        key={field}
                        onClick={() => updateField("field_of_study", field)}
                        className={`p-3 rounded-lg border text-left text-sm md:text-base ${formData.field_of_study === field
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-900 bg-white"
                          }`}
                      >
                        {field}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Countries (select multiple)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country}
                        onClick={() => toggleCountry(country)}
                        className={`px-4 py-2 rounded-full text-sm ${formData.preferred_countries.includes(country)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
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
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    value={formData.target_intake_year}
                    onChange={(e) => updateField("target_intake_year", parseInt(e.target.value))}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isValidIntakeYear(formData.target_intake_year)
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500"
                      }`}
                  />
                  {!isValidIntakeYear(formData.target_intake_year) && (
                    <p className="text-xs text-red-500 mt-1">
                      Intake year must be {new Date().getFullYear()} or later
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">Budget & Funding</h2>
                <p className="text-gray-600">Help us understand your financial planning</p>

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
                  <div className="text-center text-2xl font-bold text-blue-600 mt-2">
                    ${formData.budget_per_year.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Plan
                  </label>
                  <div className="space-y-2">
                    {FUNDING_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateField("funding_plan", option.value)}
                        className={`w-full p-4 rounded-lg border text-left ${formData.funding_plan === option.value
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-900 bg-white"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">Exam & Readiness</h2>
                <p className="text-gray-600">Where are you in your preparation?</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IELTS / TOEFL Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXAM_STATUS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => updateField("ielts_toefl_status", status.value)}
                        className={`p-3 rounded-lg border text-center text-sm ${formData.ielts_toefl_status === status.value
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GRE / GMAT Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXAM_STATUS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => updateField("gre_gmat_status", status.value)}
                        className={`p-3 rounded-lg border text-center text-sm ${formData.gre_gmat_status === status.value
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SOP (Statement of Purpose) Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SOP_STATUS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => updateField("sop_status", status.value)}
                        className={`p-3 rounded-lg border text-center text-sm ${formData.sop_status === status.value
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-none flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Completing..." : "Complete Setup"}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
