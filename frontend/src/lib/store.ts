import { create } from 'zustand';
import { User, Profile, Dashboard, Shortlist, Task, ChatMessage, University } from './api';

interface AppState {
  user: User | null;
  profile: Profile | null;
  dashboard: Dashboard | null;
  shortlist: Shortlist[];
  tasks: Task[];
  chatMessages: ChatMessage[];
  comparisonList: University[];
  addToComparison: (uni: University) => void;
  removeFromComparison: (id: number) => void;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setDashboard: (dashboard: Dashboard | null) => void;
  setShortlist: (shortlist: Shortlist[]) => void;
  setTasks: (tasks: Task[]) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  dashboard: null,
  shortlist: [],
  tasks: [],
  chatMessages: [],
  comparisonList: [],
  isLoading: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setDashboard: (dashboard) => set({ dashboard }),
  setShortlist: (shortlist) => set({ shortlist }),
  setTasks: (tasks) => set({ tasks }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  comparisonList: [] as University[],
  addToComparison: (uni: University) => set((state) => {
    if (state.comparisonList.find(u => u.id === uni.id)) return state;
    if (state.comparisonList.length >= 3) return state;
    return { comparisonList: [...state.comparisonList, uni] };
  }),
  removeFromComparison: (id: number) => set((state) => ({
    comparisonList: state.comparisonList.filter(u => u.id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({
      user: null,
      profile: null,
      dashboard: null,
      shortlist: [],
      tasks: [],
      chatMessages: []
    });
  },
}));
