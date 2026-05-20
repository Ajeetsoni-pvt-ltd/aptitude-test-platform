// frontend/src/store/authStore.ts
// ─────────────────────────────────────────────────────────────
// Zustand Auth Store — Global Authentication State
// Updated for email verification flow:
//   signup → success message (no JWT) → verify email → login → JWT
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { loginApi, signupApi } from '@/api/authApi';
import type { User, LoginFormData, RegisterFormData } from '@/types';

// ─── localStorage Keys ────────────────────────────────────────
const TOKEN_KEY = 'apt_token';
const USER_KEY  = 'apt_user';
const normalizeEmail = (email: string) => email.toLowerCase().trim();

// ─── Store State + Actions ka TypeScript Type ─────────────────
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Registration state (for post-signup email verification UI)
  registrationSuccess: boolean;
  registrationEmail: string | null;

  // Actions
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  initAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  clearRegistration: () => void;
}

// ─── Store Create karo ────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({

  // ─── Initial State ─────────────────────────────────────────
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  // Registration state
  registrationSuccess: false,
  registrationEmail: null,

  // ═══════════════════════════════════════════════════════════
  // ACTION: initAuth
  // App start hone pe call karo (App.tsx mein)
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
  // Only verified users will get a JWT from the server
  // ═══════════════════════════════════════════════════════════
  login: async (data: LoginFormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginApi({
        ...data,
        email: normalizeEmail(data.email),
      });
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
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Login failed. Please try again.';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw err;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: register (signup)
  // No longer saves token/user — just sets registrationSuccess
  // User must verify email before logging in
  // ═══════════════════════════════════════════════════════════
  register: async (data: RegisterFormData) => {
    set({ isLoading: true, error: null, registrationSuccess: false });
    try {
      const { confirmPassword, ...registerData } = data;
      void confirmPassword;

      await signupApi({
        ...registerData,
        name: registerData.name.trim(),
        email: normalizeEmail(registerData.email),
        collegeName: registerData.collegeName.trim(),
        branch: registerData.branch.trim(),
        section: registerData.section.trim(),
      });

      // Success — user needs to check email
      set({
        isLoading: false,
        error: null,
        registrationSuccess: true,
        registrationEmail: normalizeEmail(registerData.email),
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message, registrationSuccess: false });
      throw err;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: logout
  // ═══════════════════════════════════════════════════════════
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      registrationSuccess: false,
      registrationEmail: null,
    });
  },

  updateUser: (updates: Partial<User>) => set((state) => {
    if (!state.user) return state;

    const user = { ...state.user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user };
  }),

  // ═══════════════════════════════════════════════════════════
  // ACTION: clearError
  // ═══════════════════════════════════════════════════════════
  clearError: () => set({ error: null }),

  // ═══════════════════════════════════════════════════════════
  // ACTION: clearRegistration
  // Reset registration state (for navigating back to form)
  // ═══════════════════════════════════════════════════════════
  clearRegistration: () => set({ registrationSuccess: false, registrationEmail: null }),
}));
