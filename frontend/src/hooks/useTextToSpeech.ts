import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeech {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  supported: boolean;
}

// Check support once at module level (safe for SSR)
const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useTextToSpeech(): UseTextToSpeech {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef<SpeechSynthesis | null>(null);

  // Lazy initialization helper
  const getSynth = (): SpeechSynthesis | null => {
    if (!synth.current && isSupported) {
      synth.current = window.speechSynthesis;
    }
    return synth.current;
  };

  const speak = useCallback((text: string) => {
    const s = getSynth();
    if (!s) return;

    // Cancel any current speaking
    s.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to select a better voice
    const voices = s.getVoices();
    // Prefer a "Google US English" voice or similar natural ones if available
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
      voices.find(v => v.name.includes('Samantha')) ||
      voices.find(v => v.lang === 'en-US');

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("TTS Error", e);
      setIsSpeaking(false);
    };

    s.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    const s = getSynth();
    if (s) {
      s.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    supported: isSupported
  };
}
