"use client";

import { Star, Target, Shield, DollarSign, TrendingUp, Plus, Check, AlertCircle, CheckCircle, X, FileText, Loader2 } from "lucide-react";

import { University, universityApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

interface UniversityCardProps {
  university: University;
  isShortlisted: boolean;
  onShortlist: () => void;

  onClick?: () => void;
  index?: number;
  isLocked?: boolean;
}

export default function UniversityCard({
  university,
  isShortlisted,
  onShortlist,
  onClick,
  index = 0,
  isLocked = false,
  isSelectedForComparison = false,
  onToggleComparison,
}: UniversityCardProps & { isSelectedForComparison?: boolean; onToggleComparison?: () => void }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const response = await universityApi.getReport(university.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Strategy_Report_${university.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

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
      case "Low": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "Medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "High": return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getAcceptanceColor = (chance?: string) => {
    switch (chance) {
      case "High": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "Medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low": return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div
          className={`flex items-start justify-between gap-3 mb-3 ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {university.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{university.country}</p>
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

        {onToggleComparison && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelectedForComparison}
              onChange={(e) => {
                e.stopPropagation();
                onToggleComparison();
              }}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-medium">Select for comparison</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3 flex-wrap">
          {university.tuition_per_year && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="font-medium dark:text-slate-300">
                ${(university.tuition_per_year / 1000).toFixed(0)}k
              </span>
              <span className="text-slate-400 dark:text-slate-500">/yr</span>
            </div>
          )}
          {(university.qs_ranking || university.ranking) && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="font-medium dark:text-slate-300">QS #{university.qs_ranking || university.ranking}</span>
            </div>
          )}
          {university.verified_at && (
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded group/verified relative cursor-help">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Verified</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/verified:opacity-100 group-hover/verified:visible transition-all whitespace-nowrap z-10 shadow-xl">
                Verified: {new Date(university.verified_at).toLocaleDateString()}
                <br />
                Source: {university.data_source || "Official"}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-3">
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
          <div className="grid grid-cols-1 gap-1.5 mb-4 text-xs">
            {university.fit_reason && (
              <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-green-800 dark:text-green-300">{university.fit_reason}</span>
              </div>
            )}
            {university.risk_reason && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-amber-800 dark:text-amber-300">{university.risk_reason}</span>
              </div>
            )}
          </div>
        )}

        {isLocked && (
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="w-full mb-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Download Strategy Report
              </>
            )}
          </button>
        )}

        <button
          onClick={onShortlist}
          className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${isShortlisted
            ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30"
            : "bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/20 dark:shadow-blue-900/20"
            }`}
        >
          {isShortlisted ? (
            <>
              <X className="w-4 h-4" />
              Remove from Shortlist
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
