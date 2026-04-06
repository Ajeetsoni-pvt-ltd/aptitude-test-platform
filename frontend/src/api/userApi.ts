// frontend/src/api/userApi.ts
import apiClient from './axios';
import type { ApiResponse } from '@/types';

// ─── Get User Profile ──────────────────────────────────────────
export const getUserProfileApi = async (): Promise<ApiResponse<{
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}>> => {
  const response = await apiClient.get('/users/profile');
  return response.data;
};

// ─── Get User Statistics ───────────────────────────────────────
export const getUserStatsApi = async (): Promise<ApiResponse<{
  totalTests: number;
  bestScore: number;
  averageScore: number;
  totalTime: number;
  rank: number;
  recentAttempts: any[];
}>> => {
  const response = await apiClient.get('/users/stats');
  return response.data;
};

// ─── Update User Profile ───────────────────────────────────────
export const updateUserProfileApi = async (data: {
  name?: string;
  email?: string;
}): Promise<ApiResponse<{
  _id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
}>> => {
  const response = await apiClient.put('/users/profile', data);
  return response.data;
};

// ─── Upload Profile Picture ────────────────────────────────────
export const uploadProfilePictureApi = async (file: File): Promise<ApiResponse<{
  profilePicture: string;
  message: string;
}>> => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  const response = await apiClient.post('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ─── Get Global Leaderboard ────────────────────────────────────
export const getLeaderboardApi = async (limit = 50): Promise<ApiResponse<{
  totalUsers: number;
  leaderboard: Array<{
    rank: number;
    userId: string;
    name: string;
    email: string;
    score: number;
    tests: number;
    badge: string;
    isCurrentUser?: boolean;
  }>;
}>> => {
  const response = await apiClient.get(`/users/leaderboard?limit=${limit}`);
  return response.data;
};
