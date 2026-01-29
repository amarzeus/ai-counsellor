"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Loader2, CheckCircle, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { chatApi, ChatMessage } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function CounsellorPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      const storedUser = JSON.parse(userStr);
      setUser(storedUser);

      if (!storedUser.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
    }

    fetchHistory();
  }, [router, setUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = async () => {
    try {
      const response = await chatApi.getHistory();
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat history");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await chatApi.send(userMessage);
      setMessages((prev) => [...prev.slice(0, -1), tempUserMsg, response.data]);

      if (response.data.actions_taken && response.data.actions_taken.length > 0) {
        response.data.actions_taken.forEach((action) => {
          if (action.type === "shortlist_university") {
            toast.success("University added to your shortlist!");
          } else if (action.type === "create_task") {
            toast.success(`Task created: ${action.title}`);
          }
        });
      }
    } catch (error: any) {
      toast.error("Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Analyze my profile strength",
    "Recommend universities for my budget",
    "What are my chances at top schools?",
    "Help me shortlist safe universities",
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto pt-16">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 transition-colors">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Counsellor</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Your personal guide for study abroad decisions
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Hello! I'm your AI Counsellor
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                I'm here to help you navigate your study abroad journey. I can recommend
                universities, analyze your profile, and guide your applications.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200"
                  }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.actions_taken && message.actions_taken.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    {message.actions_taken.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                      >
                        {action.type === "shortlist_university" && (
                          <>
                            <Building2 className="w-4 h-4" />
                            <span>University added to shortlist</span>
                          </>
                        )}
                        {action.type === "create_task" && (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Task created: {action.title}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your study abroad journey..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
