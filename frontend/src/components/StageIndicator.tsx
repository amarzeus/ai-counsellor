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
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl border border-transparent dark:border-slate-700/50">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Your Journey
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-slate-700" />

        <div className="absolute left-[18px] top-4 w-0.5 bg-gradient-to-b from-emerald-400 to-blue-500 transition-all duration-500"
          style={{ height: `${Math.max(0, currentIndex) * 72}px` }}
        />

        <div className="space-y-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div
                key={stage.key}
                className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isCurrent
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : isCompleted
                      ? "bg-emerald-500/10"
                      : "opacity-50"
                  }`}
              >
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : isCurrent
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40 ring-4 ring-blue-500/20"
                        : "bg-slate-700 text-slate-500"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : isFuture ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${isCurrent
                          ? "text-white"
                          : isCompleted
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold uppercase rounded-full">
                        <MapPin className="w-2.5 h-2.5" />
                        You are here
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${isCurrent
                        ? "text-blue-200"
                        : isCompleted
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                  >
                    {stage.description}
                  </p>
                </div>

                {isFuture && (
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Locked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
