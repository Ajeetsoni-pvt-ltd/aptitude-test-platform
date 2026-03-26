// frontend/src/api/testApi.ts
// Dashboard ke liye test results fetch karna
import apiClient from './axios';
import type { ApiResponse, TestAttempt } from '@/types';

// ─── My Results fetch karo (with pagination) ──────────────────
export const getMyResultsApi = async (
  page = 1,
  limit = 5
): Promise<ApiResponse<{
  attempts: TestAttempt[];
  pagination: { currentPage: number; totalPages: number; totalAttempts: number };
}>> => {
  const response = await apiClient.get(`/tests/my-results?page=${page}&limit=${limit}`);
  return response.data;
};
