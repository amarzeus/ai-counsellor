"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, User, Loader2, CheckCircle, Building2, Mic, MicOff, ArrowRight, Trash2, MapPin, DollarSign, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
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
    program_name?: string;
    duration?: string;
  }>;
  suggested_next_questions?: string[];
}

// Helper for static system guidance
const getSystemGuidance = () => {
  return "Based on your profile and budget, these universities are strong matches. Review and compare the options below.";
};

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
    try {
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

      <div className="flex flex-1 overflow-hidden pt-16 w-full">
        {/* SIDEBAR */}
        <ChatSidebar
          currentSessionId={currentSessionId}
          onSessionSelect={setCurrentSessionId}
          onNewChat={() => setCurrentSessionId(null)}
        />

        {/* CHAT AREA */}
        <main className="flex-1 flex flex-col h-full relative w-full">
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-2 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-sm shrink-0">
                  <Image
                    src="/Avatar.png"
                    alt="AI"
                    fill
                    className="object-cover scale-110"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentSessionId ? "Chat Session" : "New Chat"}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    AI Counsellor & Guide
                  </p>
                </div>
              </div>

              {/* Trash icon removed or disabled as per session logic */}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-gray-50 dark:bg-[#0B1120]">
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-5 relative rounded-full overflow-hidden shadow-md">
                    <Image
                      src="/Avatar.png"
                      alt="AI"
                      fill
                      className="object-cover scale-110"
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hello! I'm your AI Counsellor
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto text-base">
                    Start a new conversation to get personalized guidance.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition"
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
                  className={`flex gap-4 mb-6 ${message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {/* USER MESSAGE - keep as chat bubble */}
                  {message.role === "user" && (
                    <>
                      <div className={`flex flex-col max-w-[80%] items-end`}>
                        <div className="rounded-2xl px-5 py-3 shadow-sm bg-blue-600 text-white">
                          <div className="prose prose-invert text-white max-w-none text-sm leading-relaxed">
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
                        <div className="space-y-2">
                          {/* 1. Guidance Strip - Section Header Style (Minimal) */}
                          {/* Increased size for clarity */}
                          <div className="flex items-center gap-3 px-1 mb-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 shadow-sm">
                              <Image
                                src="/Avatar.png"
                                alt="AI"
                                fill
                                className="object-cover scale-110"
                              />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              {getSystemGuidance()}
                            </p>
                          </div>

                          {/* 2. CARDS Surface - Standalone Grid */}
                          <div className="grid gap-4 gap-y-5 sm:grid-cols-2">
                            {message.suggested_universities.map((uni, idx) => (
                              <UniversityCard
                                key={idx}
                                university={uni}
                                index={idx}
                                onShortlistToggle={handleQuickShortlist}
                              />
                            ))}
                          </div>

                          {/* 3. Footer: Reduced Actions (Max 2) */}
                          {message.suggested_next_questions && message.suggested_next_questions.length > 0 && (
                            <div className="flex items-center justify-end gap-2 px-1 pt-3 opacity-90 hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-slate-400 font-medium mr-1 uppercase tracking-wide">Next steps:</span>
                              {message.suggested_next_questions.slice(0, 2).map((question, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setInput(question)}
                                  className="px-3 py-1 text-[10px] font-medium text-slate-600 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:border-blue-300 transition-colors shadow-sm"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular AI message (no universities) - keep bubble style */
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0 mt-1 shadow-sm">
                            <Image
                              src="/Avatar.png"
                              alt="AI"
                              fill
                              className="object-cover scale-110"
                            />
                          </div>
                          <div className="flex flex-col max-w-[85%] items-start">
                            <div className="rounded-2xl px-6 py-4 shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                              <AIMessageRenderer content={message.content} />

                              {message.actions_taken && message.actions_taken.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-1.5">
                                  {message.actions_taken.map((action: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Action Taken: {action.type}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {message.suggested_next_questions && message.suggested_next_questions.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.suggested_next_questions.map((question, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setInput(question)}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
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
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0 shadow-sm">
                    <Image
                      src="/Avatar.png"
                      alt="AI"
                      fill
                      className="object-cover scale-110"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-medium">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 transition-colors">
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
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 font-medium"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 dark:text-slate-600 mt-1.5">
                AI Counsellor can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </main>
      </div >
    </div >
  );
}
