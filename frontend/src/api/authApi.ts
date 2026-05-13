// frontend/src/api/authApi.ts
// ─────────────────────────────────────────────────────────────
// Auth API Functions — Signup, Login, Verify, Resend, Password Reset
// ─────────────────────────────────────────────────────────────

import apiClient from './axios';
import type {
  AuthResponse,
  User,
  LoginFormData,
  RegisterFormData,
  SignupResponse,
  MessageResponse,
} from '@/types';

// ─── Signup API ────────────────────────────────────────────────
// POST /api/auth/signup → Returns success message (no token)
export const signupApi = async (
  data: Omit<RegisterFormData, 'confirmPassword'>
): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/auth/signup', data);
  return response.data;
};

// ─── Login API ─────────────────────────────────────────────────
// POST /api/auth/login → Returns JWT + user (only for verified users)
export const loginApi = async (
  data: LoginFormData
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// ─── Verify Email API ──────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx
export const verifyEmailApi = async (
  token: string
): Promise<MessageResponse> => {
  const response = await apiClient.get<MessageResponse>(`/auth/verify-email?token=${token}`);
  return response.data;
};

// ─── Resend Verification Email API ─────────────────────────────
// POST /api/auth/resend-verification
export const resendVerificationApi = async (
  email: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/resend-verification', { email });
  return response.data;
};

// ─── Forgot Password API ──────────────────────────────────────
// POST /api/auth/forgot-password
export const forgotPasswordApi = async (
  email: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
  return response.data;
};

// ─── Reset Password API ──────────────────────────────────────
// POST /api/auth/reset-password
export const resetPasswordApi = async (
  token: string,
  password: string
): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/auth/reset-password', { token, password });
  return response.data;
};

// ─── Get Current User API ──────────────────────────────────────
// GET /api/auth/me (token required)
export const getMeApi = async (): Promise<User> => {
  const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
  return response.data.data;
};
