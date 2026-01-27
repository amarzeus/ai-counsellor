"use client";

import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, X, Rocket } from "lucide-react";

interface LockConfirmModalProps {
  universityName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function LockConfirmModal({
  universityName,
  isOpen,
  onClose,
  onConfirm,
}: LockConfirmModalProps) {
  const [state, setState] = useState<"confirm" | "loading" | "success">("confirm");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setState("loading");
    try {
      await onConfirm();
      setState("success");
      setTimeout(() => {
        onClose();
        setState("confirm");
      }, 2000);
    } catch {
      setState("confirm");
    }
  };

  const handleClose = () => {
    if (state !== "loading") {
      onClose();
      setState("confirm");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {state === "confirm" && (
          <>
            <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Lock This University?</h2>
              <p className="text-amber-100 text-sm">
                This is a significant decision in your journey.
              </p>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  You are locking
                </p>
                <p className="text-xl font-bold text-slate-900">{universityName}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    You'll move to the <strong>Application</strong> stage
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Application tasks will be <strong>auto-generated</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    You <strong>won't be able to add</strong> more universities
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  <Lock className="w-4 h-4" />
                  Lock It
                </button>
              </div>
            </div>
          </>
        )}

        {state === "loading" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-lg font-semibold text-slate-900">
              Locking {universityName}...
            </p>
            <p className="text-sm text-slate-500 mt-1">Generating your application tasks</p>
          </div>
        )}

        {state === "success" && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              You're Committed!
            </h2>
            <p className="text-slate-600">
              <strong>{universityName}</strong> is now locked.
            </p>
            <p className="text-sm text-emerald-600 mt-2 font-medium">
              Your application journey begins now!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
