"use client";

import { useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { chatApi } from "@/lib/api";

interface VoiceInputProps {
    onInput: (text: string) => void;
    disabled?: boolean;
}

export function VoiceInput({ onInput, disabled }: VoiceInputProps) {
    const { isRecording, startRecording, stopRecording, audioBlob, clearAudio } = useAudioRecorder();

    // Auto-transcribe when recording stops
    useEffect(() => {
        const transcribe = async () => {
            if (audioBlob) {
                const toastId = toast.loading("Dictating...");
                try {
                    const formData = new FormData();
                    // Determine extension from blob type (e.g. audio/webm -> webm)
                    const ext = audioBlob.type.split('/')[1] || 'webm';
                    // Note: Backend handles conversion if needed, but correct ext helps
                    const filename = `dictation.${ext.includes('wav') ? 'wav' : 'webm'}`;
                    formData.append("file", audioBlob, filename);

                    const res = await chatApi.transcribeVoice(formData);

                    toast.success("Dictation complete!", { id: toastId });
                    onInput(res.data.text);
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to transcribe.", { id: toastId });
                } finally {
                    clearAudio();
                }
            }
        };

        if (audioBlob) {
            transcribe();
        }
    }, [audioBlob, onInput, clearAudio]);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
            toast("Listening for dictation...", { icon: "🎙️" });
        }
    };

    return (
        <button
            onClick={toggleRecording}
            disabled={disabled}
            className={`p-3 rounded-xl transition-all ${isRecording
                ? "bg-red-50 text-red-600 animate-pulse border border-red-200"
                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600"}`}
            title={isRecording ? "Stop Dictation" : "Dictate"}
        >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
    );
}
