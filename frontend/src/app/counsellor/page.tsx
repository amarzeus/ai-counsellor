"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, User, Loader2, CheckCircle, Building2, Mic, MicOff, ArrowRight, Trash2, MapPin, DollarSign, GraduationCap, Volume2, VolumeX, StopCircle, Menu } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { chatApi, ChatMessage, shortlistApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { AIMessageRenderer } from "@/components/chat/AIMessageRenderer";
import { UniversityCard } from "@/components/chat/UniversityCard";
import { VoiceInput } from "@/components/chat/VoiceInput";
import { VoiceConversationModal } from "@/components/chat/VoiceConversationModal";

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

// REMOVED: Static guidance was causing "same message" issue
// const getSystemGuidance = () => {
//   return "Based on your profile and budget, these universities are strong matches. Review and compare the options below.";
// };

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [userIsManuallyScrolling, setUserIsManuallyScrolling] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Intelligent Scroll Handler
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // distanceToBottom is 0 when fully scrolled down
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      // If user is within 50px of bottom, they remain in "Auto Scroll Mode"
      // If they go up more than 50px, they are "Manually Scrolling"
      // We use a small buffer (e.g., 20px) to account for browser quirks
      const isAtBottom = distanceToBottom < 80;

      // Only update state if it actually changed to prevent render loops
      setUserIsManuallyScrolling(!isAtBottom);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  // Auto-scroll effect: ONLY scroll if user was ALREADY at the bottom (not manually scrolling)
  // AND a new message just arrived (not on loading state change to prevent jumps during typing)
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    // Only trigger scroll when messages count actually increases (new message arrived)
    if (messages.length > prevMessagesLengthRef.current && !userIsManuallyScrolling) {
      scrollToBottom("smooth");
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

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

  // Removed old simple effect that lacked manual check
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  // };

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

  const shouldSpeakRef = useRef(false);

  const handleSend = async (overrideInput?: string) => {
    const userMessage = overrideInput || input.trim();
    if (!userMessage || loading) return;

    setInput("");
    setLoading(true);
    setUserIsManuallyScrolling(false); // CRITICAL: Reset manual scroll state so it snaps to bottom

    // Tiny timeout to ensure state update processes before scroll (optional safety)
    setTimeout(() => scrollToBottom("smooth"), 50);

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

      // Automatic Text-to-Speech if triggered by Voice OR Voice Mode is ON
      if (shouldSpeakRef.current || isVoiceEnabled) {
        // Strip Markdown for cleaner speech
        const cleanText = assistantMessage.content.replace(/[*#_`]/g, '');
        speakResponse(cleanText);
        shouldSpeakRef.current = false;
      }

      // If we just started a new session, the backend response should now contain the session_id
      if (!currentSessionId && assistantMessage.session_id) {
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

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleDictationInput = (text: string) => {
    // Just fill the input, don't auto-send
    setInput(prev => prev + (prev ? " " : "") + text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Server-Side Voice Response
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceResponse = (data: { user_text: string; ai_response: any; audio_base64: string | null }) => {
    // 1. Add User Message
    const tempUserMsg: EnrichedChatMessage = {
      id: Date.now(),
      role: "user",
      content: data.user_text,
      created_at: new Date().toISOString(),
    };

    // 2. Add AI Message
    const assistantMessage = data.ai_response;

    // If we just started a new session, the backend response should now contain the session_id
    if (!currentSessionId && assistantMessage.session_id) {
      setCurrentSessionId(assistantMessage.session_id);
    }

    setMessages((prev) => [...prev, tempUserMsg, assistantMessage]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    // 3. Play Audio
    if (data.audio_base64) {
      stopSpeaking(); // Stop any existing audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      audio.play().catch(e => console.error("Audio play failed", e));
    }
  };

  // Override stopSpeaking to handle Audio element
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
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
    <div className="h-[calc(100dvh-5rem)] bg-gray-50 dark:bg-[#0B1120] flex flex-col overflow-hidden transition-colors duration-300">

      <div className="flex flex-1 overflow-hidden w-full">
        {/* SIDEBAR */}
        <ChatSidebar
          currentSessionId={currentSessionId}
          onSessionSelect={(id) => {
            setCurrentSessionId(id);
            setIsSidebarOpen(false);
          }}
          onNewChat={() => {
            setCurrentSessionId(null);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* CHAT AREA */}
        <main className="flex-1 flex flex-col h-full relative w-full overflow-x-hidden">

          {/* Floating Sidebar Toggle (Mobile Only) */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-20 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow-sm transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Floating Stop Button (When Speaking) */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                onClick={stopSpeaking}
                className="absolute top-4 right-4 z-20 p-2 bg-red-50/90 dark:bg-red-900/40 backdrop-blur-sm border border-red-100 dark:border-red-900/50 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/60 shadow-sm transition-colors animate-pulse"
                title="Stop Speaking"
              >
                <StopCircle className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-gray-50 dark:bg-[#0B1120]"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div className="max-w-4xl mx-auto w-full">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-5 relative">
                    <Image
                      src="/Avatar.png"
                      alt="AI"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hello! I&apos;m your AI Counsellor
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
                            <div className="w-8 h-8 relative shrink-0">
                              <Image
                                src="/Avatar.png"
                                alt="AI"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                              {extractGuidance(message.content)}
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
                          <div className="w-12 h-12 relative flex-shrink-0 mt-1">
                            <Image
                              src="/Avatar.png"
                              alt="AI"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex flex-col max-w-[85%] items-start">
                            <div className="rounded-2xl px-6 py-4 shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                              <AIMessageRenderer content={message.content} />

                              {message.actions_taken && message.actions_taken.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-1.5">
                                  { }
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
                  <div className="w-10 h-10 relative flex-shrink-0">
                    <Image
                      src="/Avatar.png"
                      alt="AI"
                      fill
                      className="object-contain"
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

          <div className="flex-shrink-0 px-2 sm:px-4 pb-2 pt-2 sm:pb-4 sm:pt-4 bg-slate-50 dark:bg-[#0B1120] transition-colors">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
                <VoiceInput onInput={handleDictationInput} disabled={loading} />

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 min-w-0 px-2 py-2 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium"
                  disabled={loading}
                />

                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors hidden sm:block"
                  title="Start Voice Conversation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-medium">
                AI Counsellor can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Voice Conversation Modal */}
      <AnimatePresence>
        {isVoiceModalOpen && (
          <VoiceConversationModal
            isOpen={isVoiceModalOpen}
            onClose={() => setIsVoiceModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div >
  );
}
