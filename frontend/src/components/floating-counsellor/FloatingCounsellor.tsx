'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCounsellor, CounsellorAction } from './CounsellorContext';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import './floating-counsellor.css';

// Icons
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const MicIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const VoiceAssistantIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const StopIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

// Stage display names
const stageDisplayNames: Record<string, string> = {
    'ONBOARDING': 'Building Profile',
    'DISCOVERY': 'Exploring Universities',
    'LOCKED': 'Finalizing Choice',
    'APPLICATION': 'Preparing Application',
};

export function FloatingCounsellor() {
    const {
        userStage,
        isAuthenticated,
        isExpanded,
        needsAttention,
        isLoading,
        guidance,
        actions,
        setExpanded,
        clearAttention,
        executeAction,
        currentRoute,
        sendMessage,
    } = useCounsellor();

    // Voice hooks
    const dictation = useVoiceDictation();
    const voiceAssistant = useVoiceAssistant();

    // Quick input state
    const [quickInput, setQuickInput] = useState('');

    // Don't render on auth pages or if not authenticated
    const authRoutes = ['/login', '/signup', '/auth', '/forgot-password'];
    const isLandingPage = currentRoute === '/';
    const isAuthPage = authRoutes.some(route => currentRoute.startsWith(route));
    const shouldHide = !isAuthenticated || isLandingPage || isAuthPage;

    if (shouldHide) {
        return null;
    }

    const handleAvatarClick = () => {
        if (needsAttention) {
            clearAttention();
        }
        setExpanded(!isExpanded);
    };

    const handleActionClick = async (action: CounsellorAction) => {
        await executeAction(action);
    };

    const handleDictationToggle = () => {
        if (dictation.isListening) {
            dictation.stopListening();
            // Append transcript to quick input
            if (dictation.transcript) {
                setQuickInput(prev => prev + dictation.transcript);
                dictation.clearTranscript();
            }
        } else {
            dictation.startListening();
        }
    };

    const handleVoiceAssistantToggle = () => {
        if (voiceAssistant.isActive) {
            voiceAssistant.endConversation();
        } else {
            voiceAssistant.startConversation();
        }
    };

    const handleQuickSend = async () => {
        if (!quickInput.trim()) return;
        await sendMessage(quickInput);
        setQuickInput('');
    };

    return (
        <div className="floating-counsellor">
            {/* Expanded Panel */}
            {isExpanded && (
                <div className="fc-panel">
                    {/* Header */}
                    <div className="fc-panel-header">
                        <div className="fc-panel-header-avatar">
                            <Image
                                src="/Avatar.png"
                                alt="AI"
                                width={64}
                                height={64}
                                quality={100}
                            />
                        </div>
                        <div className="fc-panel-header-info">
                            <p className="fc-panel-title">AI Counsellor</p>
                            <p className="fc-panel-stage">{stageDisplayNames[userStage] || userStage}</p>
                        </div>
                        <button
                            className="fc-panel-close"
                            onClick={() => setExpanded(false)}
                            aria-label="Close panel"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="fc-panel-content">
                        {isLoading || voiceAssistant.isSpeaking || voiceAssistant.isListening ? (
                            <div className="fc-loading">
                                <div className="fc-spinner" />
                                {voiceAssistant.isSpeaking && <p className="fc-status">Speaking...</p>}
                                {voiceAssistant.isListening && <p className="fc-status">Listening...</p>}
                            </div>
                        ) : (
                            <>
                                {/* Guidance */}
                                <p className="fc-guidance">{guidance}</p>

                                {/* Action Buttons (max 2) */}
                                {actions.length > 0 && (
                                    <div className="fc-actions">
                                        {actions.slice(0, 2).map((action, index) => (
                                            <button
                                                key={`${action.type}-${index}`}
                                                className={`fc-action-btn ${index === 0 ? 'fc-action-btn--primary' : 'fc-action-btn--secondary'}`}
                                                onClick={() => handleActionClick(action)}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Voice Controls */}
                                <div className="fc-voice-controls">
                                    <button
                                        className={`fc-voice-btn ${dictation.isListening ? 'fc-voice-btn--active' : ''}`}
                                        onClick={handleDictationToggle}
                                        title={dictation.isListening ? 'Stop Dictation' : 'Start Dictation'}
                                        disabled={!dictation.isSupported}
                                    >
                                        {dictation.isListening ? <StopIcon /> : <MicIcon />}
                                        {dictation.isListening ? 'Stop' : 'Dictate'}
                                    </button>
                                    <button
                                        className={`fc-voice-btn ${voiceAssistant.isActive ? 'fc-voice-btn--active' : ''}`}
                                        onClick={handleVoiceAssistantToggle}
                                        title={voiceAssistant.isActive ? 'End Conversation' : 'Start Voice Chat'}
                                        disabled={!voiceAssistant.isSupported}
                                    >
                                        {voiceAssistant.isActive ? <StopIcon /> : <VoiceAssistantIcon />}
                                        {voiceAssistant.isActive ? 'End' : 'Voice Chat'}
                                    </button>
                                </div>

                                {/* Quick Input (shows dictation transcript) */}
                                {(dictation.transcript || quickInput) && (
                                    <div className="fc-quick-input">
                                        <input
                                            type="text"
                                            value={dictation.isListening ? dictation.transcript : quickInput}
                                            onChange={(e) => setQuickInput(e.target.value)}
                                            placeholder="Type or dictate..."
                                            className="fc-input"
                                            readOnly={dictation.isListening}
                                        />
                                        <button
                                            className="fc-send-btn"
                                            onClick={handleQuickSend}
                                            disabled={dictation.isListening || !quickInput.trim()}
                                        >
                                            Send
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Avatar */}
            <button
                className={`fc-avatar ${needsAttention ? 'fc-avatar--attention' : ''}`}
                onClick={handleAvatarClick}
                aria-label={isExpanded ? 'Close AI Counsellor' : 'Open AI Counsellor'}
                aria-expanded={isExpanded}
            >
                <Image
                    src="/Avatar.png"
                    alt="AI Counsellor"
                    width={256}
                    height={256}
                    className="fc-avatar-image"
                    quality={100}
                    priority
                />
            </button>
        </div>
    );
}

export default FloatingCounsellor;
