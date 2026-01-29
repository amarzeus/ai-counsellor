"use client";

import { Star, Target, Shield, DollarSign, TrendingUp, Plus, Check, AlertCircle, CheckCircle, Info } from "lucide-react";

interface University {
  id: number;
  name: string;
  country: string;
  tuition_per_year?: number;
  ranking?: number;
  category?: string;
  cost_level?: string;
  acceptance_chance?: string;
  fit_reason?: string;
  risk_reason?: string;
}

interface UniversityCardProps {
  university: University;
  isShortlisted: boolean;
  onShortlist: () => void;
}

export default function UniversityCard({
  university,
  isShortlisted,
  onShortlist,
}: UniversityCardProps) {
  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case "DREAM":
        return {
          icon: Star,
          label: "Dream",
          bg: "bg-gradient-to-r from-violet-500 to-purple-600",
          text: "text-white",
          glow: "shadow-purple-500/40",
          description: "Ambitious choice",
        };
      case "TARGET":
        return {
          icon: Target,
          label: "Target",
          bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
          text: "text-white",
          glow: "shadow-blue-500/40",
          description: "Good fit",
        };
      case "SAFE":
        return {
          icon: Shield,
          label: "Safe",
          bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
          text: "text-white",
          glow: "shadow-emerald-500/40",
          description: "High chance",
        };
      default:
        return {
          icon: TrendingUp,
          label: "Explore",
          bg: "bg-slate-100",
          text: "text-slate-600",
          glow: "",
          description: "",
        };
    }
  };

  const config = getCategoryConfig(university.category);
  const CategoryIcon = config.icon;

  const getCostColor = (cost?: string) => {
    switch (cost) {
      case "Low": return "text-green-600 bg-green-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "High": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getAcceptanceColor = (chance?: string) => {
    switch (chance) {
      case "High": return "text-green-600 bg-green-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "Low": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
              {university.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{university.country}</p>
          </div>

          {university.category && (
            <div
              className={`flex-shrink-0 px-3 py-1.5 rounded-full ${config.bg} ${config.text} shadow-lg ${config.glow} flex items-center gap-1.5`}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wide">
                {config.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
          {university.tuition_per_year && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="font-medium">
                ${(university.tuition_per_year / 1000).toFixed(0)}k
              </span>
              <span className="text-slate-400">/yr</span>
            </div>
          )}
          {university.ranking && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="font-medium">#{university.ranking}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {university.cost_level && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getCostColor(university.cost_level)}`}>
              {university.cost_level} Cost
            </span>
          )}
          {university.acceptance_chance && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getAcceptanceColor(university.acceptance_chance)}`}>
              {university.acceptance_chance} Chance
            </span>
          )}
        </div>

        {(university.fit_reason || university.risk_reason) && (
          <div className="space-y-2 mb-4 text-xs">
            {university.fit_reason && (
              <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-800">{university.fit_reason}</span>
              </div>
            )}
            {university.risk_reason && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800">{university.risk_reason}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onShortlist}
          disabled={isShortlisted}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
            isShortlisted
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/20"
          }`}
        >
          {isShortlisted ? (
            <>
              <Check className="w-4 h-4" />
              Added to Shortlist
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Shortlist
            </>
          )}
        </button>
      </div>
    </div>
  );
}
