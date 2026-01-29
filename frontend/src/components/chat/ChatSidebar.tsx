
import { useEffect, useState } from "react";
import { MessageSquarePlus, Trash2, MessageSquare } from "lucide-react";
import { ChatSession, sessionApi } from "@/lib/api";
import toast from "react-hot-toast";

interface ChatSidebarProps {
    currentSessionId: number | null;
    onSessionSelect: (id: number | null) => void;
    onNewChat: () => void;
}

export default function ChatSidebar({ currentSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, [currentSessionId]); // Refetch when session changes (e.g. new title created)

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

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Delete this chat?")) return;

        try {
            await sessionApi.delete(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            if (currentSessionId === id) {
                onNewChat(); // Go to new chat if current one deleted
            }
            toast.success("Chat deleted");
        } catch (error) {
            toast.error("Failed to delete chat");
        }
    };

    return (
        <div className="w-64 bg-gray-100 dark:bg-[#0f172a] border-r border-gray-200 dark:border-slate-800 flex flex-col h-full transition-colors hidden md:flex">
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition"
                >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No recent chats</div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => onSessionSelect(session.id)}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id
                                    ? "bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400"
                                    : "text-gray-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800"
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-sm font-medium">{session.title || "Untitled Chat"}</span>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                                title="Delete chat"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
