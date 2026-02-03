import { useState, useCallback, useEffect, useRef } from 'react';

interface UseTextToSpeech {
  isSpeaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  supported: boolean;
}

export function useTextToSpeech(): UseTextToSpeech {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synth.current = window.speechSynthesis;
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth.current) return;

    // Cancel any current speaking
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to select a better voice
    const voices = synth.current.getVoices();
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

    synth.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    supported
  };
}
