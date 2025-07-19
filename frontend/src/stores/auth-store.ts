import { create } from 'zustand';
import { api, setAuthToken, getAuthToken } from '../services/api-client';

export interface User {
  id: string;
  githubId: string;
  username: string;
  avatarUrl?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signIn: async (code: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await api.auth.signIn(code);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await api.auth.signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if the server call fails, we should clear local auth state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      });
    }
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const user = await api.auth.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthToken(null); // Clear invalid token
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Don't show error for expired tokens
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  initializeAuth: async () => {
    await get().getCurrentUser();
  },
}));