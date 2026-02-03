import { useState, useEffect, useCallback, useRef } from 'react';

// Web Speech API type declarations (not included in standard TS lib)
interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface UseVoiceInputDisconnect {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputDisconnect {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as SpeechRecognitionType;
        recognitionRef.current = recognition;
        recognition.continuous = true; // Keep listening even if the user pauses
        recognition.interimResults = true; // Show results as they are spoken
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onend = () => {
          // Only auto-restart if we intended to keep listening? 
          // For now, let's keep it simple: stop state update.
          // If we implement 'continuous' chat mode later, we might handle auto-restart here.
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied.');
          } else if (event.error === 'no-speech') {
            // Ignore no-speech errors usually, just means silence
          } else {
            setError(`Voice error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          // We want to append final results to what we already have, 
          // but for this simple hook, replacing state with current accumulation is safer 
          // if we handle the accumulation logic carefully.
          // Actually, SpeechRecognition accumulates results in the session usually.
          // Let's rely on the event returning the full session text if continuous is true?
          // Wait, standard behavior for 'continuous=true' is: results list grows.
          // Let's just concatenate all final results in the list.

          let currentSessionText = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentSessionText += event.results[i][0].transcript;
            }
          }
          // Add interim at the end
          const fullText = currentSessionText + interimTranscript;
          setTranscript(fullText);
        };
      }
      // Note: Don't call setError here - will be set lazily in startListening if not supported
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript(''); // Clear previous on new start
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    } else if (!recognitionRef.current) {
      setError('Browser does not support voice input.');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}
