"use client";

import { Check, Lock } from "lucide-react";

interface StageIndicatorProps {
  currentStage: string;
}

const STAGES = [
  { key: "ONBOARDING", label: "Profile" },
  { key: "DISCOVERY", label: "Discover" },
  { key: "LOCKED", label: "Finalize" },
  { key: "APPLICATION", label: "Apply" },
];

export default function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          Your Journey
        </span>
      </div>

      <div className="flex items-center w-full min-w-0">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold mb-1 flex-shrink-0 ${isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={3} />
                  ) : isFuture ? (
                    <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[8px] sm:text-[9px] font-medium text-center truncate max-w-full ${isCurrent
                    ? "text-blue-600 dark:text-blue-400"
                    : isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}>
                  {stage.label}
                </span>
                {isCurrent && (
                  <span className="mt-0.5 px-1 py-0.5 bg-blue-500 text-white text-[6px] sm:text-[7px] font-bold uppercase rounded flex-shrink-0">
                    Here
                  </span>
                )}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 sm:mx-1 min-w-[8px] ${idx < currentIndex ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
