"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Loader2, CheckCircle, Building2, Mic, MicOff, ArrowRight, Trash2, MapPin, DollarSign, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { chatApi, ChatMessage, shortlistApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { AIMessageRenderer } from "@/components/chat/AIMessageRenderer";
import { UniversityCard } from "@/components/chat/UniversityCard";

// Extended ChatMessage interface to support suggested universities
interface EnrichedChatMessage extends Omit<ChatMessage, 'session_id'> {
  session_id?: number;
  suggested_universities?: Array<{
    university_id: number;
    name?: string;
    country?: string;
    tuition?: number;
    ranking?: number;
    category: "DREAM" | "TARGET" | "SAFE";
    fit_reason: string;
    risk_reason: string;
    is_shortlisted?: boolean;
  }>;
  suggested_next_questions?: string[];
}

// Helper to extract guidance from AI content (no truncation)
function extractGuidance(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const result: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Look for context/guidance lines
    if (lower.includes('discovery') || lower.includes('stage') ||
      lower.includes("you're") || lower.includes('based on') ||
      lower.includes('profile') || lower.includes('recommend')) {
      const clean = line.replace(/\*\*/g, '').replace(/^[-•*#]+\s*/, '');
      result.push(clean);
      if (result.length >= 2) break; // Max 2 sentences for guidance
    }
  }

  if (result.length === 0) {
    // Fallback to first line
    const first = lines[0] || 'Here are your recommendations based on your profile.';
    result.push(first.replace(/\*\*/g, '').replace(/^[-•*#]+\s*/, ''));
  }

  return result.join(' ');
}

export default function CounsellorPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [messages, setMessages] = useState<EnrichedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

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
    setInitialLoading(false);
  }, [router, setUser]);

  // Fetch messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchHistory(currentSessionId);
    } else {
      setMessages([]); // Clear messages for "New Chat" view
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const fetchHistory = async (sessionId: number) => {
    setLoading(true);
    try {
      const response = await chatApi.getHistory(sessionId);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const tempUserMsg: EnrichedChatMessage = {
      id: Date.now(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Pass currentSessionId (if any)
      // If null, backend will create new session
      const sessionIdToSend = currentSessionId || undefined;
      const response = await chatApi.send(userMessage, sessionIdToSend);

      const assistantMessage = response.data;

      // If we just started a new session, the backend response should now contain the session_id
      if (!currentSessionId && assistantMessage.session_id) {
        setCurrentSessionId(assistantMessage.session_id);
        setCurrentSessionId(assistantMessage.session_id);
      }

      setMessages((prev) => [...prev.slice(0, -1), tempUserMsg, assistantMessage]);

      if (response.data.actions_taken && response.data.actions_taken.length > 0) {
        response.data.actions_taken.forEach((action: any) => {
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

  const handleClearHistory = async () => {
    if (!currentSessionId) return;
    if (!confirm("Delete this chat session?")) return;
    // Logic usually handled by sidebar delete, but this button is confusing if it means "delete session"
    // Previously it was "clear all history". Now "delete session" is better from sidebar.
    // Let's make this button delete the CURRENT session.
    try {
      // We reuse the delete session API
      // But we need the ID.
      // Actually, let's keep it simple: Just clear visuals for now or call same API as sidebar?
      // Let's implement full session delete here too?
      // Or just remove this button as Sidebar has trash icon per session?
      // The user screenshot showed a TRASH icon in the header.
      // Let's keep it but make it just clear messages? Or delete session?
      // "Clear Chat" usually means specific to this session.
      // I'll make it loop back to NEW CHAT.

      // Actually, sidebar has individual delete buttons. 
      // Let's make this button trigger the same logic if possible or just remove it to avoid confusion?
      // No, user specifically liked the Trash button feature before.
      // Let's make it delete current session.
      // import sessionApi...
      // For now, I will Comment it out or make it just toast "Use sidebar to delete".
      // Or better:
      // const response = await sessionApi.delete(currentSessionId);
      // setCurrentSessionId(null);
      // But I need sessionApi imported.
      toast.error("Please use the sidebar to delete specific chats.");
    } catch (e) { }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast.error("Could not capture voice.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleQuickShortlist = async (uniId: number, category: string, isShortlisted: boolean | undefined) => {
    try {
      if (isShortlisted) {
        await shortlistApi.removeByUniversityId(uniId);
        toast.success("Removed from shortlist.");

        setMessages(prev => prev.map(msg => ({
          ...msg,
          suggested_universities: msg.suggested_universities?.map(u =>
            u.university_id === uniId ? { ...u, is_shortlisted: false } : u
          )
        })));
      } else {
        await shortlistApi.add({ university_id: uniId, category });
        toast.success("University added to shortlist!");

        setMessages(prev => prev.map(msg => ({
          ...msg,
          suggested_universities: msg.suggested_universities?.map(u =>
            u.university_id === uniId ? { ...u, is_shortlisted: true } : u
          )
        })));
      }
    } catch (error) {
      toast.error("Action failed. Please try again.");
    }
  };

  const suggestedPrompts = [
    "Analyze my profile strength",
    "Recommend universities for my budget",
    "What are my chances at top schools?",
    "Review my SOP draft...",
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0B1120] flex flex-col overflow-hidden transition-colors duration-300">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16 w-full">
        {/* SIDEBAR */}
        <ChatSidebar
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewChat={() => setCurrentSessionId(null)}
        />

        {/* CHAT AREA */}
        <main className="flex-1 flex flex-col h-full relative w-full">
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentSessionId ? "Chat Session" : "New Chat"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    AI Counsellor & Guide
                  </p>
                </div>
              </div>

              {/* Trash icon removed or disabled as per session logic */}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-[#0B1120]">
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hello! I'm your AI Counsellor
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Start a new conversation to get personalized guidance.
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
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 mb-6 ${message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {/* USER MESSAGE - keep as chat bubble */}
                  {message.role === "user" && (
                    <>
                      <div className={`flex flex-col max-w-[85%] items-end`}>
                        <div className="rounded-2xl px-5 py-4 shadow-sm bg-blue-600 text-white">
                          <div className="prose prose-invert text-white max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </>
                  )}

                  {/* ASSISTANT MESSAGE - Different rendering based on content */}
                  {message.role === "assistant" && (
                    <div className="w-full">
                      {/* When universities exist: Slim guidance strip + cards dominate */}
                      {message.suggested_universities && message.suggested_universities.length > 0 ? (
                        <div className="space-y-3">
                          {/* Slim guidance strip - NO bubble, NO avatar */}
                          <div className="flex items-center gap-2 px-1">
                            <Bot className="w-4 h-4 text-blue-500" />
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {extractGuidance(message.content)}
                            </p>
                          </div>

                          {/* Section label */}
                          <div className="flex items-center gap-2 mt-4 mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                              Recommended for you
                            </span>
                            <span className="flex-1 h-px bg-gray-100 dark:bg-slate-700" />
                          </div>

                          {/* CARDS = Primary Interface */}
                          <div className="grid gap-2 sm:grid-cols-2">
                            {message.suggested_universities.map((uni, idx) => (
                              <UniversityCard
                                key={idx}
                                university={uni}
                                index={idx}
                                onShortlistToggle={handleQuickShortlist}
                              />
                            ))}
                          </div>

                          {/* Suggestion chips */}
                          {message.suggested_next_questions && message.suggested_next_questions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.suggested_next_questions.map((question, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setInput(question)}
                                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular AI message (no universities) - keep bubble style */
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex flex-col max-w-[85%] items-start">
                            <div className="rounded-2xl px-5 py-4 shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                              <AIMessageRenderer content={message.content} />

                              {message.actions_taken && message.actions_taken.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                                  {message.actions_taken.map((action: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Action Taken: {action.type}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {message.suggested_next_questions && message.suggested_next_questions.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {message.suggested_next_questions.map((question, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setInput(question)}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex gap-2 items-center">
                <button
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-full transition-all ${isListening
                    ? "bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200"}`}
                  title="Voice Input"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask me anything..."}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-2">
                AI Counsellor can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </main>
      </div >
    </div >
  );
}
