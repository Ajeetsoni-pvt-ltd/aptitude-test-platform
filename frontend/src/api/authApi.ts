// frontend/src/api/authApi.ts
// ─────────────────────────────────────────────────────────────
// Auth API Functions — Login, Register, GetMe
// Yeh functions Zustand store mein use honge
// Kyun alag file: API calls aur State management alag rehni chahiye
// ─────────────────────────────────────────────────────────────

import apiClient from './axios';
import type { AuthResponse, User, LoginFormData, RegisterFormData } from '@/types';

// ─── Register API ──────────────────────────────────────────────
// POST /api/auth/register
export const registerApi = async (
  data: Omit<RegisterFormData, 'confirmPassword'>
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// ─── Login API ─────────────────────────────────────────────────
// POST /api/auth/login
export const loginApi = async (
  data: LoginFormData
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// ─── Get Current User API ──────────────────────────────────────
// GET /api/auth/me (token required — interceptor automatically lagayega)
export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
  return response.data.data;
};
