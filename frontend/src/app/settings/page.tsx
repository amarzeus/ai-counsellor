"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    User,
    Lock,
    Bell,
    Shield,
    Trash2,
    ChevronRight,
    ArrowLeft,
    Save,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import { userApi, authApi } from "@/lib/api";
import { useStore } from "@/lib/store";

type TabType = "general" | "security" | "preferences";

export default function SettingsPage() {
    const router = useRouter();
    const { user, setUser } = useStore();
    const [activeTab, setActiveTab] = useState<TabType>("general");
    const [saving, setSaving] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.full_name);
            setEmail(user.email);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await userApi.updateMe({ full_name: name, email });
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setSaving(true);
        try {
            await authApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password changed successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to change password");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action is permanent.")) {
            try {
                await userApi.deleteAccount();
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
                toast.success("Account deleted");
            } catch (error: any) {
                toast.error("Failed to delete account");
            }
        }
    };

    const tabs = [
        { id: "general", label: "General", icon: User },
        { id: "security", label: "Security", icon: Shield },
        { id: "preferences", label: "Preferences", icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20">

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
                        <p className="text-sm text-slate-500">Manage your profile and security preferences</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <aside className="w-full md:w-64 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        {activeTab === "general" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Security</h2>
                                    {user?.google_id && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold ring-1 ring-blue-100 dark:ring-blue-800">
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Linked with Google
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    {user?.has_password ? (
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswords(!showPasswords)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                >
                                                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl">
                                            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                                You haven&apos;t set a local password yet. Create one to enable email login.
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</label>
                                            <input
                                                type={showPasswords ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Min. 8 characters"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                                            <input
                                                type={showPasswords ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="Re-enter password"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex items-center justify-between">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            {user?.has_password ? "Update Password" : "Set Password"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "preferences" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">User Preferences</h2>
                                <div className="space-y-4">
                                    {[
                                        { id: "email_notif", label: "Email Notifications", desc: "Receive updates about task deadlines", default: true },
                                        { id: "ai_notif", label: "AI Suggestions", desc: "Get proactive advice from the counsellor", default: true },
                                        { id: "marketing", label: "Marketing Emails", desc: "News and student success stories", default: false }
                                    ].map((pref) => (
                                        <div key={pref.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{pref.label}</h3>
                                                <p className="text-xs text-slate-500">{pref.desc}</p>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked={pref.default} className="sr-only peer" />
                                                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
