'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCounsellor } from '@/components/floating-counsellor';
import type {
    SpeechRecognition,
    SpeechRecognitionEvent,
    SpeechRecognitionErrorEvent
} from '@/types/speech-recognition';

interface UseVoiceAssistant {
    isActive: boolean;
    isSpeaking: boolean;
    isListening: boolean;
    startConversation: () => void;
    endConversation: () => void;
    isSupported: boolean;
    error: string | null;
}

/**
 * Mode 2: Voice Conversation Assistant
 * 
 * Purpose:
 * - Real-time spoken conversation with AI Counsellor
 * 
 * Behavior:
 * - Separate "Voice Assistant" button
 * - AI speaks first
 * - Turn-based (push-to-talk is acceptable)
 * - AI listens, responds via TTS
 * 
 * Rules:
 * - Uses SAME AI brain as text
 * - Enforces ALL PRD rules
 * - Cannot bypass stages
 * - Must verbally explain blocked actions
 * - Must confirm irreversible actions (e.g. locking)
 * 
 * Automation via Voice:
 * - Update profile from spoken answers
 * - Move user across stages
 * - Shortlist universities
 * - Lock university (with confirmation)
 * - Create and update tasks
 */
export function useVoiceAssistant(): UseVoiceAssistant {
    const { sendMessage, userStage } = useCounsellor();

    const [isActive, setIsActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Check browser support
    const speechRecognitionSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isSupported = speechRecognitionSupported && speechSynthesisSupported;

    // Speak text using TTS
    const speak = useCallback((text: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!speechSynthesisSupported) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1;
            utterance.volume = 1;

            // Try to get an English voice
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            synthesisRef.current = utterance;

            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };

            utterance.onerror = (event) => {
                setIsSpeaking(false);
                reject(new Error(event.error));
            };

            window.speechSynthesis.speak(utterance);
        });
    }, [speechSynthesisSupported]);

    // Listen for user speech
    const listen = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!speechRecognitionSupported) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognitionAPI();
            recognitionRef.current = recognition;

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            let transcript = '';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                transcript = event.results[0][0].transcript;
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                setIsListening(false);
                reject(new Error(event.error));
            };

            recognition.onend = () => {
                setIsListening(false);
                resolve(transcript);
            };

            recognition.start();
        });
    }, [speechRecognitionSupported]);

    // Start a voice conversation
    const startConversation = useCallback(async () => {
        if (!isSupported) {
            setError('Voice features not supported in this browser');
            return;
        }

        setIsActive(true);
        setError(null);

        try {
            // AI speaks first with a greeting based on stage
            const greetings: Record<string, string> = {
                'ONBOARDING': "Hello! I'm your AI Counsellor. I see you're still building your profile. What would you like to tell me about yourself?",
                'DISCOVERY': "Hi there! Let's explore some universities together. What kind of program are you looking for?",
                'LOCKED': "Welcome back! I see you've shortlisted some universities. Would you like to lock your final choice?",
                'APPLICATION': "Hello! Let's work on your application tasks. What would you like help with today?",
            };

            await speak(greetings[userStage] || greetings['ONBOARDING']);

            // Start the conversation loop
            while (isActive) {
                // Listen for user input
                const userSpeech = await listen();

                if (!userSpeech || userSpeech.toLowerCase().includes('goodbye') || userSpeech.toLowerCase().includes('exit')) {
                    await speak("Goodbye! I'll be here whenever you need me.");
                    setIsActive(false);
                    break;
                }

                // Send to AI and get response
                try {
                    const response = await sendMessage(userSpeech);
                    await speak(response.message);
                } catch (err) {
                    await speak("I'm sorry, I had trouble understanding that. Could you please try again?");
                }
            }
        } catch (err) {
            console.error('Voice assistant error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setIsActive(false);
        }
    }, [isSupported, userStage, speak, listen, sendMessage, isActive]);

    // End the voice conversation
    const endConversation = useCallback(() => {
        setIsActive(false);

        // Cancel ongoing speech
        if (speechSynthesisSupported) {
            window.speechSynthesis.cancel();
        }

        // Stop recognition
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        setIsSpeaking(false);
        setIsListening(false);
    }, [speechSynthesisSupported]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (speechSynthesisSupported) {
                window.speechSynthesis.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [speechSynthesisSupported]);

    return {
        isActive,
        isSpeaking,
        isListening,
        startConversation,
        endConversation,
        isSupported,
        error,
    };
}

export default useVoiceAssistant;
