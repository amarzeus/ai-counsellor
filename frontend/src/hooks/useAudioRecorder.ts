/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecorderState {
    isRecording: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
    isSilenceDetected: boolean;
}

interface AudioRecorderOptions {
    silenceThreshold?: number; // Decibels (0 to 255/100ish)
    silenceDuration?: number; // ms to wait before stopping
    maxDuration?: number; // ms to force stop
}

export function useAudioRecorder({ silenceThreshold = 10, silenceDuration = 1500, maxDuration = 10000 }: AudioRecorderOptions = {}) {
    'use no memo'; // Opt out of React Compiler strict memoization due to complex ref patterns

    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        recordingTime: 0,
        audioBlob: null,
        isSilenceDetected: false,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // VAD Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const cleanupAudioContext = () => {
        if (state.isRecording) {
            // Don't close context if we want to reuse? Actually we should close to release mic.
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            cleanupAudioContext();
        }
    }, [state.isRecording]); // Dependencies might be tricky here, assume ref handles current instance

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup MediaRecorder with Higher Quality
            const options = {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000 // 128kbps for better clarity
            };

            // Fallback for Safari/Legacy which might not support options
            try {
                mediaRecorderRef.current = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn("High quality audio not supported, falling back to default", e);
                mediaRecorderRef.current = new MediaRecorder(stream);
            }
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));

                // Cleanup stream
                stream.getTracks().forEach(track => track.stop());
                cleanupAudioContext();
            };

            // Setup VAD (Audio Context)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 512;
            analyserRef.current.smoothingTimeConstant = 0.4;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let isSpeakingAlready = false;
            let speakingStartTime = 0;
            const MIN_SPEAKING_DURATION = 300;

            const checkVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                if (average > silenceThreshold) {
                    if (!isSpeakingAlready) {
                        speakingStartTime = Date.now();
                        isSpeakingAlready = true;
                    }
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                } else {
                    if (isSpeakingAlready) {
                        const spokeDuration = Date.now() - speakingStartTime;
                        if (spokeDuration > MIN_SPEAKING_DURATION && !silenceTimerRef.current) {
                            silenceTimerRef.current = setTimeout(() => {
                                console.log(`Silence detected, auto-stopping...`);
                                stopRecording();
                            }, silenceDuration);
                        } else if (spokeDuration <= MIN_SPEAKING_DURATION) {
                            isSpeakingAlready = false;
                        }
                    }
                }
                animationFrameRef.current = requestAnimationFrame(checkVolume);
            };

            mediaRecorderRef.current.start();
            checkVolume();

            // Reset State
            setState(prev => ({
                ...prev,
                isRecording: true,
                audioBlob: null,
                recordingTime: 0,
                isSilenceDetected: false
            }));

            timerRef.current = setInterval(() => {
                setState(prev => {
                    // Max Duration Check
                    if (prev.recordingTime >= (maxDuration / 1000)) {
                        stopRecording(); // Force stop
                        return prev;
                    }
                    return { ...prev, recordingTime: prev.recordingTime + 1 };
                });
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    }, [silenceThreshold, silenceDuration, maxDuration, stopRecording]);

    // Ensure stopRecording is stable and doesn't cause infinite loops when passed as dependency
    // Actually, stopRecording needs access to the CURRENT refs, so it should be fine.

    // Force cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAudioContext();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const clearAudio = useCallback(() => {
        setState(prev => ({ ...prev, audioBlob: null, recordingTime: 0, isSilenceDetected: false }));
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording,
        clearAudio
    };
}
