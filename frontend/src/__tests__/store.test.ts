/**
 * Zustand store tests
 */
import { act, renderHook } from '@testing-library/react';
import { useStore } from '@/lib/store';

describe('useStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        const { result } = renderHook(() => useStore());
        act(() => {
            result.current.logout();
        });
    });

    describe('user management', () => {
        it('should have null user initially', () => {
            const { result } = renderHook(() => useStore());
            expect(result.current.user).toBeNull();
        });

        it('should set user correctly', () => {
            const { result } = renderHook(() => useStore());
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                full_name: 'Test User',
                current_stage: 'DISCOVERY',
                onboarding_completed: true
            };

            act(() => {
                result.current.setUser(mockUser as any);
            });

            expect(result.current.user).toEqual(mockUser);
        });
    });

    describe('comparison list', () => {
        it('should add university to comparison', () => {
            const { result } = renderHook(() => useStore());
            const mockUni = { id: 1, name: 'MIT', country: 'USA' };

            act(() => {
                result.current.addToComparison(mockUni as any);
            });

            expect(result.current.comparisonList).toHaveLength(1);
            expect(result.current.comparisonList[0].name).toBe('MIT');
        });

        it('should not add duplicate universities', () => {
            const { result } = renderHook(() => useStore());
            const mockUni = { id: 1, name: 'MIT', country: 'USA' };

            act(() => {
                result.current.addToComparison(mockUni as any);
                result.current.addToComparison(mockUni as any);
            });

            expect(result.current.comparisonList).toHaveLength(1);
        });

        it('should limit comparison to 3 universities', () => {
            const { result } = renderHook(() => useStore());

            act(() => {
                result.current.addToComparison({ id: 1, name: 'MIT' } as any);
                result.current.addToComparison({ id: 2, name: 'Stanford' } as any);
                result.current.addToComparison({ id: 3, name: 'Harvard' } as any);
                result.current.addToComparison({ id: 4, name: 'Yale' } as any);
            });

            expect(result.current.comparisonList).toHaveLength(3);
            expect(result.current.comparisonList.find(u => u.name === 'Yale')).toBeUndefined();
        });

        it('should remove university from comparison', () => {
            const { result } = renderHook(() => useStore());

            act(() => {
                result.current.addToComparison({ id: 1, name: 'MIT' } as any);
                result.current.addToComparison({ id: 2, name: 'Stanford' } as any);
            });

            act(() => {
                result.current.removeFromComparison(1);
            });

            expect(result.current.comparisonList).toHaveLength(1);
            expect(result.current.comparisonList[0].name).toBe('Stanford');
        });
    });

    describe('chat messages', () => {
        it('should add chat message', () => {
            const { result } = renderHook(() => useStore());
            const mockMessage = {
                id: 1,
                role: 'user' as const,
                content: 'Hello',
                created_at: new Date().toISOString()
            };

            act(() => {
                result.current.addChatMessage(mockMessage as any);
            });

            expect(result.current.chatMessages).toHaveLength(1);
            expect(result.current.chatMessages[0].content).toBe('Hello');
        });

        it('should set all chat messages', () => {
            const { result } = renderHook(() => useStore());
            const messages = [
                { id: 1, role: 'user', content: 'Hello' },
                { id: 2, role: 'assistant', content: 'Hi there!' }
            ];

            act(() => {
                result.current.setChatMessages(messages as any);
            });

            expect(result.current.chatMessages).toHaveLength(2);
        });
    });

    describe('logout', () => {
        it('should clear all state on logout', () => {
            const { result } = renderHook(() => useStore());

            // Set some state
            act(() => {
                result.current.setUser({ id: 1, email: 'test@example.com' } as any);
                result.current.addChatMessage({ id: 1, content: 'test' } as any);
                result.current.setShortlist([{ id: 1 }] as any);
            });

            // Logout
            act(() => {
                result.current.logout();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.profile).toBeNull();
            expect(result.current.chatMessages).toHaveLength(0);
            expect(result.current.shortlist).toHaveLength(0);
        });
    });

    describe('loading state', () => {
        it('should toggle loading state', () => {
            const { result } = renderHook(() => useStore());

            expect(result.current.isLoading).toBe(false);

            act(() => {
                result.current.setLoading(true);
            });

            expect(result.current.isLoading).toBe(true);

            act(() => {
                result.current.setLoading(false);
            });

            expect(result.current.isLoading).toBe(false);
        });
    });
});
