"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
}: DeleteAccountModalProps) {
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (inputValue !== "delete my account") return;

        setIsLoading(true);
        try {
            await onConfirm();
        } catch {
            setIsLoading(false);
        }
    };

    const isConfirmed = inputValue === "delete my account";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 p-6 flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account?</h2>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            This action is permanent and cannot be undone.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="mb-4">
                            You are about to permanently delete your account and all associated data:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mb-4 text-slate-500 dark:text-slate-400">
                            <li>All personal profile data</li>
                            <li>University shortlists and tasks</li>
                            <li>Chat history with AI Counsellor</li>
                            <li>Generated SOPs and documents</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Type <span className="font-mono font-bold text-red-600">delete my account</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="delete my account"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isConfirmed || isLoading}
                            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
