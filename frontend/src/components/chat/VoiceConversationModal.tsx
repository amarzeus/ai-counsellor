"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, X, Globe, MessageSquare, Square, Volume2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { chatApi } from "@/lib/api";
import { ParticleGlobe } from "@/components/ui/ParticleGlobe";
import toast from "react-hot-toast";

interface VoiceConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: number | null;
    onMessageSent?: (newSessionId?: number) => void; // Callback to refresh chat
}


const LANGUAGES = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
];

export function VoiceConversationModal({ isOpen, onClose, sessionId, onMessageSent }: VoiceConversationModalProps) {
    const [language, setLanguage] = useState("en");
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [status, setStatus] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING">("IDLE");
    const [showLangMenu, setShowLangMenu] = useState(false);

    // Transcript
    const [transcript, setTranscript] = useState<{ user: string; ai: string }>({ user: "", ai: "" });

    // VAD & Loop Logic
    // VAD & Loop Logic
    const { isRecording, startRecording, stopRecording, audioBlob, clearAudio, isSilenceDetected } = useAudioRecorder({
        silenceThreshold: 30, // Lowered to 30 to better detect speech
        silenceDuration: 1500, // Increased to 1.5s to avoid cutting off mid-sentence
        maxDuration: 10000 // 10s failsafe
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 1. Process Audio
    useEffect(() => {
        const processAudio = async () => {
            // Ensure meaningful audio (check if blob is large enough, e.g., > 1KB)
            if (audioBlob && audioBlob.size > 1000) {
                setStatus("PROCESSING");
                try {
                    const formData = new FormData();
                    const ext = audioBlob.type.split('/')[1] || 'webm';
                    const filename = `voice.${ext.includes('wav') ? 'wav' : 'webm'}`;
                    formData.append("file", audioBlob, filename);

                    // Add session_id if available
                    if (sessionId) {
                        formData.append("session_id", sessionId.toString());
                    }

                    const res = await chatApi.sendVoice(formData, language);
                    const data = res.data;

                    setTranscript({
                        user: data.user_text,
                        ai: data.ai_response.message
                    });

                    // Handle Actions Visual Feedback
                    if (data.ai_response.actions && data.ai_response.actions.length > 0) {
                        data.ai_response.actions.forEach((action: any) => {
                            if (action.type === 'shortlist_university') toast.success("University Shortlisted! 🎓");
                            if (action.type === 'lock_university') toast.success("University Locked! 🔒");
                            if (action.type === 'create_task') toast.success("New Task Created! ✅");
                        });
                    }

                    // Trigger refresh of chat history if callback provided
                    if (onMessageSent) onMessageSent(data.session_id);

                    if (data.audio_base64) {
                        playAudio(data.audio_base64);
                    } else {
                        // If no audio, go back to listening
                        setStatus("LISTENING");
                        startRecording();
                    }
                } catch (err: any) {
                    // Ignore 400 errors from strict VAD, silent failures are better than alerts
                    console.error("Voice Processing Error:", err);

                    // If backend says "Could not understand audio" (400), just loop back to listening
                    // This creates a seamless "ignoring noise" experience
                    if (err.response && err.response.status === 400) {
                        setStatus("LISTENING");
                        startRecording();
                    } else {
                        // Real error (500, network, etc.) -> Stop
                        setStatus("IDLE");
                    }
                } finally {
                    clearAudio();
                }
            } else if (audioBlob) {
                // Audio too short/empty - ignore and reset
                console.log("Audio too short, ignoring.");
                clearAudio();
                if (status === "PROCESSING") {
                    setStatus("LISTENING");
                    startRecording();
                }
            }
        };

        if (audioBlob) {
            processAudio();
        }
    }, [audioBlob, language, clearAudio, sessionId, onMessageSent]);

    const playAudio = (base64: string) => {
        const performPlay = () => {
            if (audioRef.current) {
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mp3' });
                const url = URL.createObjectURL(blob);

                audioRef.current.src = url;

                setStatus("SPEAKING");
                audioRef.current.play().catch(e => {
                    console.error("Playback failed (likely user interaction needed):", e);
                    // Fallback loop
                    setStatus("LISTENING");
                    startRecording();
                });
            } else {
                console.warn("Audio ref missing, cannot play. Looping back.");
                setStatus("LISTENING");
                startRecording();
            }
        };

        // Make sure we give React a tick to mount ref if needed
        if (!audioRef.current) {
            setTimeout(performPlay, 50);
        } else {
            performPlay();
        }
    };

    const handleAudioEnded = () => {
        setStatus("LISTENING");
        startRecording();
    };

    const stopAll = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (isRecording) stopRecording();
        setStatus("IDLE");
    };

    useEffect(() => {
        if (isOpen) {
            // Initial Greeting
            setStatus("SPEAKING");
            // Use browser TTS for immediate greeting
            const greeting = new SpeechSynthesisUtterance("Hello, I'm your AI Counsellor. Go ahead, I'm listening.");
            greeting.rate = 1.0;

            greeting.onend = () => {
                setStatus("LISTENING");
                startRecording();
            };

            // Cancel any previous speech
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(greeting);

        } else {
            stopAll();
        }
    }, [isOpen]);

    const handleMicToggle = () => {
        // Stop browser TTS if playing
        window.speechSynthesis.cancel();

        if (status === "LISTENING") {
            // User wants to stop listening and process
            stopRecording();
        } else if (status === "SPEAKING") {
            // User interrupts AI (Backend Audio)
            if (audioRef.current) audioRef.current.pause();
            startRecording();
            setStatus("LISTENING");
        } else if (status === "PROCESSING") {
            // Do nothing or cancel? Let's just wait for now.
        } else {
            // IDLE -> Start
            startRecording();
            setStatus("LISTENING");
        }
    };

    // Playback Logic - must be BEFORE any early returns
    useEffect(() => {
        if (status === "SPEAKING" && audioRef.current) {
            audioRef.current.play().catch(e => {
                // Ignore AbortError which happens on rapid cleanup/pausing
                if (e.name !== 'AbortError') {
                    console.error("Playback failed:", e);
                }
            });
        }
    }, [status]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed bottom-20 right-8 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none group">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="relative flex flex-col items-center justify-center pointer-events-auto"
                    >
                        {/* 1. Close Button - Visible only on hover */}
                        <button
                            onClick={onClose}
                            className="absolute -top-4 -right-4 p-2 bg-slate-900/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100 duration-300 z-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* 2. Main Visualizer - Floating Globe */}
                        <div className="w-80 h-80 relative flex items-center justify-center">
                            {/* Ambient Glow - Subtle */}
                            <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${status === 'LISTENING' ? 'bg-red-500/10' :
                                status === 'SPEAKING' ? 'bg-green-500/10' : 'bg-blue-500/5'
                                }`} />

                            <div className="w-full h-full relative z-10 cursor-move">
                                <ParticleGlobe state={status} />
                            </div>
                        </div>

                        {/* 3. Subtitles - Only if active */}
                        <AnimatePresence>
                            {showSubtitles && (transcript.user || transcript.ai) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none"
                                >
                                    <div className="max-w-[260px] px-4 py-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 text-center shadow-sm">
                                        <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-3 text-shadow-sm">
                                            {status === "SPEAKING" ? transcript.ai : transcript.user || "..."}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 4. Controls - Reveal on Hover */}
                        <div className="absolute -bottom-2 flex items-center gap-4 p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-2xl z-40">
                            <button
                                className={`p-2 rounded-full transition-all ${showSubtitles ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`}
                                onClick={() => setShowSubtitles(!showSubtitles)}
                                title="Toggle Subtitles"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>

                            <button
                                onClick={handleMicToggle}
                                className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${status === "LISTENING"
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : status === "PROCESSING"
                                        ? "bg-slate-700 text-slate-400"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                            >
                                {status === "LISTENING" ? (
                                    <div className="w-2.5 h-2.5 bg-white rounded-[1px]" />
                                ) : status === "PROCESSING" ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
                            </button>

                            <div className="relative group/lang">
                                <button className="p-2 rounded-full text-slate-400 hover:text-white transition-all">
                                    <Globe className="w-4 h-4" />
                                </button>
                                {/* Mini Lang Menu Popup */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover/lang:block transition-all">
                                    {LANGUAGES.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => setLanguage(l.code)}
                                            className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-white/5 ${language === l.code ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'}`}
                                        >
                                            {l.flag} {l.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
