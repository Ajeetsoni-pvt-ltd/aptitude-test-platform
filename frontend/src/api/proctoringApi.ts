// frontend/src/api/proctoringApi.ts
import apiClient from './axios';

export const logViolationApi = async (attemptId: string, payload: { type: string; details?: string }) => {
  const response = await apiClient.post(`/proctoring/${attemptId}/violations`, payload);
  return response.data;
};

// Admin APIs
export const getActiveProctorTests = async () => {
  const response = await apiClient.get('/proctoring/active');
  return response.data;
};

export const getFlaggedTests = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/proctoring/flagged', {
    params: { page, limit },
  });
  return response.data;
};

export const getViolationLog = async (attemptId: string) => {
  const response = await apiClient.get(`/proctoring/${attemptId}/violations`);
  return response.data;
};

