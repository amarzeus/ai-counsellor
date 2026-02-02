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
}

const LANGUAGES = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
];

export function VoiceConversationModal({ isOpen, onClose }: VoiceConversationModalProps) {
    const [language, setLanguage] = useState("en");
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [status, setStatus] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING">("IDLE");
    const [showLangMenu, setShowLangMenu] = useState(false);

    // Transcript
    const [transcript, setTranscript] = useState<{ user: string; ai: string }>({ user: "", ai: "" });

    const { isRecording, startRecording, stopRecording, audioBlob, clearAudio } = useAudioRecorder();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 1. Process Audio
    useEffect(() => {
        const processAudio = async () => {
            if (audioBlob) {
                setStatus("PROCESSING");
                try {
                    const formData = new FormData();
                    const ext = audioBlob.type.split('/')[1] || 'webm';
                    const filename = `voice.${ext.includes('wav') ? 'wav' : 'webm'}`;
                    formData.append("file", audioBlob, filename);

                    const res = await chatApi.sendVoice(formData, language);
                    const data = res.data;
                    
                    setTranscript({
                        user: data.user_text,
                        ai: data.ai_response.message
                    });

                    if (data.audio_base64) {
                        playAudio(data.audio_base64);
                    } else {
                        setStatus("IDLE");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to process voice.");
                    setStatus("IDLE");
                } finally {
                    clearAudio();
                }
            }
        };

        if (audioBlob) {
            processAudio();
        }
    }, [audioBlob, language, clearAudio]);

    // 2. Audio Playback
    const playAudio = (base64: string) => {
        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        audioRef.current = audio;

        audio.onplay = () => setStatus("SPEAKING");
        audio.onended = () => setStatus("IDLE");
        audio.play().catch(console.error);
    };

    const stopAll = () => {
        if (audioRef.current) audioRef.current.pause();
        if (isRecording) stopRecording();
        setStatus("IDLE");
    };

    useEffect(() => {
        if (!isOpen) stopAll();
    }, [isOpen]);

    const handleMicToggle = () => {
        if (status === "LISTENING") {
            stopRecording();
        } else {
            startRecording();
            setStatus("LISTENING");
        }
    };

    if (!isOpen) return null;

    const isActive = status === "LISTENING" || status === "SPEAKING" || status === "PROCESSING";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                        style={{ height: '600px' }}
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
                            {/* Interaction Mode Badge */}
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium text-slate-300 transition-colors"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{LANGUAGES.find(l => l.code === language)?.name}</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </button>
                                
                                <AnimatePresence>
                                    {showLangMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-12 left-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl w-40 z-30"
                                        >
                                            {LANGUAGES.map(l => (
                                                <button
                                                    key={l.code}
                                                    onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300"
                                                >
                                                    {l.flag} {l.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Visualizer Area */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                             {/* Gradient Glow */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-20'}`} />

                            <div className="w-full h-full max-w-[350px] max-h-[350px] relative z-10 opacity-90">
                                <ParticleGlobe isActive={isActive} />
                            </div>

                             {/* Status Text */}
                            <div className="absolute bottom-10 left-0 right-0 text-center z-20">
                                <AnimatePresence mode="wait">
                                    {status === "PROCESSING" && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-blue-400 text-sm font-medium animate-pulse"
                                        >
                                            Thinking...
                                        </motion.p>
                                    )}
                                    {status === "LISTENING" && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-slate-400 text-sm font-medium"
                                        >
                                            Listening...
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Subtitles (Overlay) */}
                        <AnimatePresence>
                            {showSubtitles && (transcript.user || transcript.ai) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-32 left-6 right-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 z-20"
                                >
                                    <p className="text-center text-slate-200 text-sm leading-relaxed font-medium">
                                        {status === "SPEAKING" ? transcript.ai : transcript.user || "..."}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Bottom Controls */}
                        <div className="p-8 pb-10 flex items-center justify-center gap-6 relative z-30">
                            <button
                                onClick={() => setShowSubtitles(!showSubtitles)}
                                className={`p-3 rounded-full transition-colors ${showSubtitles ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleMicToggle}
                                className={`w-16 h-16 flex items-center justify-center rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                                    status === "LISTENING" 
                                    ? "bg-red-500 shadow-red-500/30 ring-4 ring-red-500/20" 
                                    : "bg-blue-600 shadow-blue-600/30 hover:bg-blue-500"
                                }`}
                            >
                                {status === "LISTENING" || status === "PROCESSING" ? (
                                    <Square className="w-6 h-6 text-white fill-current rounded-sm" />
                                ) : (
                                    <Mic className="w-7 h-7 text-white" />
                                )}
                            </button>

                            <button className="p-3 rounded-full text-slate-500 hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
                                <Volume2 className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
