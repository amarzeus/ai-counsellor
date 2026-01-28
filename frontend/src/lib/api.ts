import axios from 'axios';

// In development (Replit), use relative paths to leverage Next.js rewrites proxy
// In production, use the full backend URL from env var
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string;
  current_stage: 'ONBOARDING' | 'DISCOVERY' | 'LOCKED' | 'APPLICATION';
  onboarding_completed: boolean;
}

export interface Profile {
  id: number;
  current_education_level?: string;
  degree_major?: string;
  graduation_year?: number;
  gpa?: number;
  intended_degree?: string;
  field_of_study?: string;
  target_intake_year?: number;
  preferred_countries?: string[];
  budget_per_year?: number;
  funding_plan?: string;
  ielts_toefl_status?: string;
  gre_gmat_status?: string;
  sop_status?: string;
  profile_strength?: string;
}

export interface University {
  id: number;
  name: string;
  country: string;
  tuition_per_year: number;
  ranking?: number;
  min_gpa?: number;
  programs?: string[];
  description?: string;
  acceptance_rate?: number;
  category?: 'DREAM' | 'TARGET' | 'SAFE';
  fit_reason?: string;
  risk_reason?: string;
  cost_level?: string;
  acceptance_chance?: string;
}

export interface Shortlist {
  id: number;
  university_id: number;
  university: University;
  category: 'DREAM' | 'TARGET' | 'SAFE';
  is_locked: boolean;
  locked_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: number;
  due_date?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  actions_taken?: { type: string; [key: string]: any }[];
  created_at: string;
}

export interface Dashboard {
  user: User;
  profile?: Profile;
  current_stage: string;
  profile_strength: {
    academics: string;
    exams: string;
    sop: string;
    overall: string;
  };
  shortlisted_count: number;
  locked_count: number;
  pending_tasks: number;
  next_action: string;
}

export const authApi = {
  signup: (data: { email: string; password: string; full_name: string }) =>
    api.post('/api/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  getMe: () => api.get<User>('/api/user/me'),
};

export const profileApi = {
  get: () => api.get<Profile>('/api/profile'),
  update: (data: Partial<Profile>) => api.put<Profile>('/api/profile', data),
  completeOnboarding: () => api.post('/api/onboarding/complete'),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/api/dashboard'),
};

export const universityApi = {
  getAll: (params?: { country?: string; max_tuition?: number }) =>
    api.get<University[]>('/api/universities', { params }),
};

export const shortlistApi = {
  getAll: () => api.get<Shortlist[]>('/api/shortlist'),
  add: (data: { university_id: number; category: string }) =>
    api.post<Shortlist>('/api/shortlist', data),
  lock: (id: number) => api.post(`/api/shortlist/${id}/lock`),
  unlock: (id: number) => api.post(`/api/shortlist/${id}/unlock`),
  remove: (id: number) => api.delete(`/api/shortlist/${id}`),
};

export const taskApi = {
  getAll: () => api.get<Task[]>('/api/tasks'),
  create: (data: { title: string; description?: string; priority?: number }) =>
    api.post<Task>('/api/tasks', data),
  update: (id: number, data: { status: string }) =>
    api.put<Task>(`/api/tasks/${id}`, data),
};

export const chatApi = {
  getHistory: () => api.get<ChatMessage[]>('/api/chat/history'),
  send: (content: string) => api.post<ChatMessage>('/api/chat', { content }),
};

export default api;
