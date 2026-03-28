// frontend/src/api/analysisApi.ts
// ─────────────────────────────────────────────────────────────
// Analysis API — Performance data fetch karne ke liye
// ─────────────────────────────────────────────────────────────

import apiClient from './axios';

// ─── All attempts fetch (analysis ke liye zyada limit) ────────
export const getAnalysisDataApi = async () => {
  // Last 50 attempts fetch karo — charts ke liye kaafi hai
  const response = await apiClient.get('/tests/my-results?page=1&limit=50');
  return response.data;
};