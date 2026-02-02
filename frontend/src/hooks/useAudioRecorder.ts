import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
    isRecording: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
}

export function useAudioRecorder() {
    const [state, setState] = useState<AudioRecorderState>({
        isRecording: false,
        recordingTime: 0,
        audioBlob: null,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                console.log("Recording stopped. MIME type:", mimeType);
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();

            setState(prev => ({ ...prev, isRecording: true, audioBlob: null, recordingTime: 0 }));

            timerRef.current = setInterval(() => {
                setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [state.isRecording]);

    const clearAudio = useCallback(() => {
        setState(prev => ({ ...prev, audioBlob: null, recordingTime: 0 }));
    }, []);

    return {
        ...state,
        startRecording,
        stopRecording,
        clearAudio
    };
}
