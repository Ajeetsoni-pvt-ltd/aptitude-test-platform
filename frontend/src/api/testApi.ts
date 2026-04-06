// frontend/src/api/testApi.ts
import apiClient from './axios';
import type { ApiResponse, TestAttempt, Question } from '@/types';

// ─── Get Subtopics ────────────────────────────────────────────
export const getSubtopicsApi = async (topic: string): Promise<ApiResponse<{
  topic: string;
  subtopics: string[];
  total: number;
}>> => {
  const response = await apiClient.get(`/tests/subtopics/${encodeURIComponent(topic)}`);
  return response.data;
};

// ─── My Results ───────────────────────────────────────────────
export const getMyResultsApi = async (
  page = 1,
  limit = 50,
  filters?: {
    topic?: string;
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
  }
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.topic)    params.append('topic',    filters.topic);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo)   params.append('dateTo',   filters.dateTo);
  if (filters?.minScore !== undefined) params.append('minScore', String(filters.minScore));
  if (filters?.maxScore !== undefined) params.append('maxScore', String(filters.maxScore));

  const response = await apiClient.get(`/tests/my-results?${params.toString()}`);
  return response.data;
};

// ─── Start Test ───────────────────────────────────────────────
export const startTestApi = async (data: {
  topic: string;
  difficulty?: string;
  count: number;
  title?: string;
  subtopics?: string[];
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
// ─── Start Scheduled Test ─────────────────────────────────
export const startScheduledTestApi = async (
  scheduledTestId: string
): Promise<ApiResponse<{
  attemptId: string;
  title: string;
  totalQuestions: number;
  questions: Question[];
  durationSeconds: number;
}>> => {
  const response = await apiClient.post(`/scheduled-tests/${scheduledTestId}/start`);
  return response.data;
};
