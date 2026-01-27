"use client";

import { Check, Circle } from "lucide-react";

interface StageIndicatorProps {
  currentStage: string;
}

const STAGES = [
  { key: "ONBOARDING", label: "Building Profile" },
  { key: "DISCOVERY", label: "Discovering Universities" },
  { key: "LOCKED", label: "Finalizing Universities" },
  { key: "APPLICATION", label: "Preparing Applications" },
];

export default function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Your Journey</h3>
      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-blue-500">Current Stage</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
