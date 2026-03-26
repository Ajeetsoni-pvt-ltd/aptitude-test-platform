// frontend/src/api/testApi.ts — Puri file replace karo
import apiClient from './axios';
import type { ApiResponse, TestAttempt, Question } from '@/types';

// ─── My Results ───────────────────────────────────────────────
export const getMyResultsApi = async (page = 1, limit = 5) => {
  const response = await apiClient.get(
    `/tests/my-results?page=${page}&limit=${limit}`
  );
  return response.data;
};

// ─── Start Test ───────────────────────────────────────────────
export const startTestApi = async (data: {
  topic: string;
  difficulty?: string;
  count: number;
  title?: string;
}): Promise<ApiResponse<{
  attemptId: string;
  title: string;
  totalQuestions: number;
  questions: Question[];
}>> => {
  const response = await apiClient.post('/tests/start', data);
  return response.data;
};

// ─── Submit Test ──────────────────────────────────────────────
export const submitTestApi = async (
  attemptId: string,
  data: {
    answers: { questionId: string; selectedAnswer: string; timeSpent: number }[];
    totalTime: number;
  }
): Promise<ApiResponse<{
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  topicPerformance: Record<string, { correct: number; total: number }>;
}>> => {
  const response = await apiClient.post(`/tests/${attemptId}/submit`, data);
  return response.data;
};

// ─── Get Attempt Detail ───────────────────────────────────────
export const getAttemptByIdApi = async (
  attemptId: string
): Promise<ApiResponse<TestAttempt>> => {
  const response = await apiClient.get(`/tests/${attemptId}`);
  return response.data;
};
