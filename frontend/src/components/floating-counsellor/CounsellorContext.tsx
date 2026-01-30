'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { dashboardApi, profileApi, shortlistApi, taskApi, chatApi, Profile, Task, Shortlist } from '@/lib/api';

// Types
export type UserStage = 'ONBOARDING' | 'DISCOVERY' | 'LOCKED' | 'APPLICATION';

export interface CounsellorAction {
    type: string;
    label: string;
    params?: Record<string, unknown>;
}

export interface AIResponse {
    message: string;
    actions: CounsellorAction[];
    suggested_universities?: Array<{
        university_id: number;
        category: string;
        fit_reason: string;
        risk_reason: string;
    }>;
    suggested_next_questions?: string[];
}

interface CounsellorContextValue {
    // User state
    userStage: UserStage;
    profileCompleteness: number;
    shortlistedCount: number;
    lockedCount: number;
    pendingTasks: Task[];
    currentRoute: string;
    isAuthenticated: boolean;

    // UI state
    isExpanded: boolean;
    needsAttention: boolean;
    attentionReason: string;
    isLoading: boolean;

    // Current guidance
    guidance: string;
    actions: CounsellorAction[];

    // Actions
    setExpanded: (expanded: boolean) => void;
    triggerAttention: (reason: string) => void;
    clearAttention: () => void;
    sendMessage: (message: string) => Promise<AIResponse>;
    executeAction: (action: CounsellorAction) => Promise<void>;
    refreshContext: () => Promise<void>;
}

const CounsellorContext = createContext<CounsellorContextValue | undefined>(undefined);

// Stage-based default guidance messages
const getDefaultGuidance = (stage: UserStage, profileCompleteness: number): string => {
    switch (stage) {
        case 'ONBOARDING':
            if (profileCompleteness < 100) {
                return `Let's complete your profile (${profileCompleteness}% done).`;
            }
            return 'Your profile is ready! Click to continue to Discovery.';
        case 'DISCOVERY':
            return 'Explore universities and build your shortlist.';
        case 'LOCKED':
            return 'Review your shortlisted universities and lock your choice.';
        case 'APPLICATION':
            return 'Let\'s work on your application tasks.';
        default:
            return 'I\'m here to help with your study abroad journey.';
    }
};

// Stage-based default actions
const getDefaultActions = (stage: UserStage, profileCompleteness: number): CounsellorAction[] => {
    switch (stage) {
        case 'ONBOARDING':
            if (profileCompleteness < 100) {
                return [{ type: 'navigate', label: 'Complete Profile', params: { path: '/profile' } }];
            }
            return [{ type: 'navigate', label: 'Start Discovery', params: { path: '/universities' } }];
        case 'DISCOVERY':
            return [{ type: 'navigate', label: 'View Universities', params: { path: '/universities' } }];
        case 'LOCKED':
            return [{ type: 'navigate', label: 'View Shortlist', params: { path: '/universities' } }];
        case 'APPLICATION':
            return [{ type: 'navigate', label: 'View Tasks', params: { path: '/tasks' } }];
        default:
            return [];
    }
};

interface CounsellorProviderProps {
    children: ReactNode;
}

export function CounsellorProvider({ children }: CounsellorProviderProps) {
    const pathname = usePathname();

    // User state
    const [userStage, setUserStage] = useState<UserStage>('ONBOARDING');
    const [profileCompleteness, setProfileCompleteness] = useState(0);
    const [shortlistedCount, setShortlistedCount] = useState(0);
    const [lockedCount, setLockedCount] = useState(0);
    const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // UI state
    const [isExpanded, setExpanded] = useState(false);
    const [needsAttention, setNeedsAttention] = useState(false);
    const [attentionReason, setAttentionReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Guidance state
    const [guidance, setGuidance] = useState('');
    const [actions, setActions] = useState<CounsellorAction[]>([]);

    // Calculate profile completeness from profile data
    const calculateProfileCompleteness = (profile: Profile | null): number => {
        if (!profile) return 0;

        const fields = [
            'current_education_level',
            'degree_major',
            'graduation_year',
            'gpa',
            'intended_degree',
            'field_of_study',
            'target_intake_year',
            'preferred_countries',
            'budget_per_year',
            'funding_plan',
        ];

        const completed = fields.filter(field => {
            const value = profile[field as keyof Profile];
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined && value !== '';
        }).length;

        return Math.round((completed / fields.length) * 100);
    };

    // Fetch all context data
    const refreshContext = useCallback(async () => {
        // Check if user is authenticated
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        setIsAuthenticated(true);

        try {
            // Fetch dashboard data (includes user stage)
            const dashboardResponse = await dashboardApi.get();
            const dashboard = dashboardResponse.data;

            setUserStage(dashboard.current_stage as UserStage);
            setShortlistedCount(dashboard.shortlisted_count);
            setLockedCount(dashboard.locked_count);

            // Fetch profile for completeness calculation
            try {
                const profileResponse = await profileApi.get();
                const completeness = calculateProfileCompleteness(profileResponse.data);
                setProfileCompleteness(completeness);
            } catch {
                setProfileCompleteness(0);
            }

            // Fetch tasks
            try {
                const tasksResponse = await taskApi.getAll();
                const pending = tasksResponse.data.filter(t => t.status === 'PENDING');
                setPendingTasks(pending);
            } catch {
                setPendingTasks([]);
            }

            // Set default guidance based on stage
            setGuidance(getDefaultGuidance(dashboard.current_stage as UserStage, profileCompleteness));
            setActions(getDefaultActions(dashboard.current_stage as UserStage, profileCompleteness));

        } catch (error) {
            console.error('Failed to refresh counsellor context:', error);
        }
    }, [profileCompleteness]);

    // Trigger attention state
    const triggerAttention = useCallback((reason: string) => {
        setNeedsAttention(true);
        setAttentionReason(reason);
    }, []);

    // Clear attention state
    const clearAttention = useCallback(() => {
        setNeedsAttention(false);
        setAttentionReason('');
    }, []);

    // Send message to AI
    const sendMessage = useCallback(async (message: string): Promise<AIResponse> => {
        setIsLoading(true);
        try {
            const response = await chatApi.send(message);
            const data = response.data;

            // Update guidance from AI response
            if (data.content) {
                // Extract first sentence or keep it short for guidance
                const content = data.content;
                const firstSentence = content.split(/[.!?]/)[0] + '.';
                setGuidance(firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence);
            }

            // Parse actions from AI response if available
            if (data.actions_taken && Array.isArray(data.actions_taken)) {
                const newActions = data.actions_taken.map((a: { type: string; params?: Record<string, unknown> }) => ({
                    type: a.type,
                    label: a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    params: a.params
                }));
                setActions(newActions.slice(0, 2)); // Max 2 actions per design spec
            }

            return {
                message: data.content,
                actions: (data.actions_taken || []).map((a: { type: string; params?: Record<string, unknown> }) => ({
                    type: a.type,
                    label: a.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    params: a.params
                })),
                suggested_universities: [],
                suggested_next_questions: []
            };
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Execute an action
    const executeAction = useCallback(async (action: CounsellorAction) => {
        if (action.type === 'navigate' && action.params?.path) {
            window.location.href = action.params.path as string;
            return;
        }

        // For other actions, send to the AI to execute
        setIsLoading(true);
        try {
            await sendMessage(`Execute action: ${action.type}`);
            await refreshContext();
        } finally {
            setIsLoading(false);
        }
    }, [sendMessage, refreshContext]);

    // Refresh context on mount and route change
    useEffect(() => {
        refreshContext();
    }, [pathname, refreshContext]);

    // Check for attention triggers
    useEffect(() => {
        if (!isAuthenticated) return;

        // Trigger attention for incomplete profile in onboarding
        if (userStage === 'ONBOARDING' && profileCompleteness < 100 && profileCompleteness > 0) {
            triggerAttention('Complete your profile to continue');
        }

        // Trigger attention for pending tasks
        if (userStage === 'APPLICATION' && pendingTasks.length > 0) {
            triggerAttention(`${pendingTasks.length} tasks pending`);
        }
    }, [userStage, profileCompleteness, pendingTasks, isAuthenticated, triggerAttention]);

    const value: CounsellorContextValue = {
        userStage,
        profileCompleteness,
        shortlistedCount,
        lockedCount,
        pendingTasks,
        currentRoute: pathname,
        isAuthenticated,
        isExpanded,
        needsAttention,
        attentionReason,
        isLoading,
        guidance,
        actions,
        setExpanded,
        triggerAttention,
        clearAttention,
        sendMessage,
        executeAction,
        refreshContext,
    };

    return (
        <CounsellorContext.Provider value={value}>
            {children}
        </CounsellorContext.Provider>
    );
}

export function useCounsellor() {
    const context = useContext(CounsellorContext);
    if (context === undefined) {
        throw new Error('useCounsellor must be used within a CounsellorProvider');
    }
    return context;
}
