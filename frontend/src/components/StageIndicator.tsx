"use client";

import { Check, Lock, MapPin } from "lucide-react";

interface StageIndicatorProps {
  currentStage: string;
}

const STAGES = [
  { key: "ONBOARDING", label: "Profile", description: "Build your profile" },
  { key: "DISCOVERY", label: "Discover", description: "Find universities" },
  { key: "LOCKED", label: "Finalize", description: "Lock your choices" },
  { key: "APPLICATION", label: "Apply", description: "Prepare applications" },
];

export default function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Your Journey
        </span>
      </div>

      <div className="space-y-1.5">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isCurrent
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                : isCompleted
                  ? "bg-emerald-50 dark:bg-emerald-900/10"
                  : "opacity-50"
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${isCompleted
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                    ? "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : isFuture ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${isCurrent
                      ? "text-blue-700 dark:text-blue-300"
                      : isCompleted
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-500"
                      }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold uppercase rounded">
                      Here
                    </span>
                  )}
                </div>
                {(isCurrent || isCompleted) && (
                  <p className={`text-xs ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {stage.description}
                  </p>
                )}
              </div>

              {isFuture && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-medium">
                  Locked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
