// frontend/src/store/authStore.ts
// ─────────────────────────────────────────────────────────────
// Zustand Auth Store — Global Authentication State
// Zustand + localStorage = Best of both worlds [web:103]
//   Zustand  → Instant UI updates (reactive)
//   localStorage → Page refresh ke baad bhi login rahe (persistent)
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { loginApi, registerApi } from '@/api/authApi';
import type { User, LoginFormData, RegisterFormData } from '@/types';

// ─── localStorage Keys ────────────────────────────────────────
// Prefix 'apt_' → other apps ke keys se conflict nahi hoga
const TOKEN_KEY = 'apt_token';
const USER_KEY  = 'apt_user';

// ─── Store State + Actions ka TypeScript Type ─────────────────
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  initAuth: () => void;    // App start hone pe call karo
  clearError: () => void;  // Error message clear karo
}

// ─── Store Create karo ────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({

  // ─── Initial State ─────────────────────────────────────────
  // localStorage check karo → pehle se logged in hai?
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  // ═══════════════════════════════════════════════════════════
  // ACTION: initAuth
  // App start hone pe call karo (main.tsx ya App.tsx mein)
  // localStorage mein token hai toh → state restore karo
  // ═══════════════════════════════════════════════════════════
  initAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } catch {
        // Corrupt data → clean up karo
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: login
  // ═══════════════════════════════════════════════════════════
  login: async (data: LoginFormData) => {
    set({ isLoading: true, error: null });
    try {
      // API call
      const response = await loginApi(data);
      const { token, user } = response.data;

      // localStorage mein save karo (persistence ke liye)
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Zustand state update karo (instant UI update)
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      // Axios error se message nikalo
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Login failed. Dobara try karo.';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw err; // Component ko bhi pata chale
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: register
  // ═══════════════════════════════════════════════════════════
  register: async (data: RegisterFormData) => {
    set({ isLoading: true, error: null });
    try {
      const { confirmPassword, ...registerData } = data;
      void confirmPassword; // TypeScript unused var warning avoid

      const response = await registerApi(registerData);
      const { token, user } = response.data;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Registration failed. Dobara try karo.';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw err;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: logout
  // State + localStorage dono clean karo [web:103]
  // ═══════════════════════════════════════════════════════════
  logout: () => {
    // localStorage clean karo
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Zustand state reset karo
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: clearError
  // Form submit ke baad error message hide karne ke liye
  // ═══════════════════════════════════════════════════════════
  clearError: () => set({ error: null }),
}));
