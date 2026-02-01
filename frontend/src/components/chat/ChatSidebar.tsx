
import { useEffect, useState, useRef } from "react";
import { MessageSquarePlus, Trash2, MessageSquare, MoreVertical, Edit2, Check, X } from "lucide-react";
import { ChatSession, sessionApi } from "@/lib/api";
import toast from "react-hot-toast";

interface ChatSidebarProps {
    currentSessionId: number | null;
    onSessionSelect: (id: number | null) => void;
    onNewChat: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatSidebar({ currentSessionId, onSessionSelect, onNewChat, isOpen, onClose }: ChatSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Menu & Edit State
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null); // For modal

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSessions();

        // Click outside to close menu
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [currentSessionId]);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    const fetchSessions = async () => {
        try {
            const response = await sessionApi.getAll();
            setSessions(response.data);
        } catch (error) {
            console.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const handleMenuToggle = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === id ? null : id);
    };

    const startRename = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditTitle(session.title || "");
        setMenuOpenId(null);
    };

    const saveRename = async () => {
        if (!editingId) return;
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }

        // Optimistic update
        const oldSessions = [...sessions];
        setSessions(prev => prev.map(s => s.id === editingId ? { ...s, title: editTitle } : s));
        setEditingId(null);

        try {
            await sessionApi.update(editingId, editTitle);
            toast.success("Renamed successfully");
        } catch (error) {
            setSessions(oldSessions); // Revert on fail
            toast.error("Failed to rename");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveRename();
        if (e.key === "Escape") setEditingId(null);
    };

    const confirmDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setDeleteId(id);
        setMenuOpenId(null);
    };

    const executeDelete = async () => {
        if (!deleteId) return;

        try {
            await sessionApi.delete(deleteId);
            setSessions((prev) => prev.filter((s) => s.id !== deleteId));
            if (currentSessionId === deleteId) {
                onNewChat();
            }
            toast.success("Chat deleted");
        } catch (error) {
            toast.error("Failed to delete chat");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 dark:bg-[#0f172a] border-r border-gray-200 dark:border-slate-800 
                transform transition-transform duration-300 ease-in-out flex flex-col h-full
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                md:relative md:translate-x-0 md:flex
            `}>
                {/* Mobile Close Button */}
                <div className="md:hidden absolute right-2 top-2">
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-md font-medium"
                    >
                        <MessageSquarePlus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm animate-pulse">Loading chats...</div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                            <MessageSquare className="w-8 h-8 opacity-20" />
                            <p className="text-sm">No recent chats</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSessionSelect(session.id)}
                                className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id
                                    ? "bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200"
                                    }`}
                            >
                                {editingId === session.id ? (
                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            ref={inputRef}
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onBlur={saveRename}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-blue-400 rounded px-2 py-1 text-sm outline-none text-gray-900 dark:text-slate-100 min-w-0"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className="truncate text-sm font-medium">{session.title || "Untitled Chat"}</span>
                                        </div>

                                        {/* 3-Dot Menu Button */}
                                        <button
                                            onClick={(e) => handleMenuToggle(e, session.id)}
                                            className={`p-1.5 rounded-md transition-all ${menuOpenId === session.id ? 'opacity-100 bg-gray-200 dark:bg-slate-700' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </>
                                )}

                                {/* Dropdown Menu */}
                                {menuOpenId === session.id && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-2 top-10 z-50 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 animation-fade-in"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => startRename(e, session)}
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Rename
                                        </button>
                                        <button
                                            onClick={(e) => confirmDelete(e, session.id)}
                                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-slate-700">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Chat?</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                        Are you sure you want to delete this conversation? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
