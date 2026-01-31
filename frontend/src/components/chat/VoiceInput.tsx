"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "@/lib/store";

interface VoiceInputProps {
    onInput: (text: string) => void;
    disabled?: boolean;
}

export function VoiceInput({ onInput, disabled }: VoiceInputProps) {
    const { user } = useStore();
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const toggleVoiceInput = () => {
        // Premium Gating
        if (user?.subscription_plan !== "PREMIUM") {
            toast.error("Voice Mode is a Premium Feature. Upgrade to unlock.", {
                icon: "💎",
                duration: 4000
            });
            return;
        }

        if (isListening) {
            stopListening();
            return;
        }

        startListening();
    };

    const startListening = () => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            toast.error("Voice input is not supported in this browser.");
            return;
        }

        // @ts-expect-error: SpeechRecognition is not part of standard TS lib
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();

        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            toast.success("Listening...", { icon: "🎙️" });
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onInput(transcript);
            setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
            setIsListening(false);
            // toast.error("Could not capture voice.");
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    return (
        <button
            onClick={toggleVoiceInput}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all ${isListening
                ? "bg-red-50 text-red-600 animate-pulse"
                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600"}`}
            title="Voice Input"
        >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
    );
}
