'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
    SpeechRecognition,
    SpeechRecognitionEvent,
    SpeechRecognitionErrorEvent
} from '@/types/speech-recognition';

interface UseVoiceDictation {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    clearTranscript: () => void;
    isSupported: boolean;
    error: string | null;
}

/**
 * Mode 1: Voice Dictation (Utility)
 * 
 * Purpose:
 * - Replace typing with speech-to-text
 * 
 * Behavior:
 * - Mic icon inside text input
 * - Converts speech to text
 * - Populates input field only
 * - Message sends ONLY when user clicks Send
 * 
 * Rules:
 * - No automation
 * - No AI response triggered automatically
 * - No PRD logic execution
 */
export function useVoiceDictation(): UseVoiceDictation {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check if browser supports Web Speech API
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Initialize speech recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionAPI();

        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // Update transcript with final + interim results
            setTranscript(prev => {
                if (finalTranscript) {
                    return prev + finalTranscript;
                }
                return prev + interimTranscript;
            });
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        return () => {
            recognition.abort();
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported || !recognitionRef.current) {
            setError('Speech recognition not supported');
            return;
        }

        setError(null);
        setTranscript('');

        try {
            recognitionRef.current.start();
        } catch (e) {
            // Recognition might already be running
            console.error('Failed to start recognition:', e);
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        clearTranscript,
        isSupported,
        error,
    };
}

export default useVoiceDictation;
