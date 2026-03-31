// frontend/src/api/adminApi.ts
import apiClient from './axios';

// ─── Admin Stats ───────────────────────────────────────────────
export const getAdminStatsApi = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// ─── All Users ─────────────────────────────────────────────────
export const getAllUsersApi = async (page = 1, limit = 10, search = '') => {
  const response = await apiClient.get(
    `/admin/users?page=${page}&limit=${limit}&search=${search}`
  );
  return response.data;
};

// ─── Role Update ───────────────────────────────────────────────
export const updateUserRoleApi = async (userId: string, role: string) => {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

// ─── Delete User ───────────────────────────────────────────────
export const deleteUserApi = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

// ─── All Questions (Admin view) ────────────────────────────────
export const getQuestionsAdminApi = async (
  page = 1, limit = 10, topic = '', difficulty = ''
) => {
  const params = new URLSearchParams({
    page: String(page), limit: String(limit),
    ...(topic && { topic }),
    ...(difficulty && { difficulty }),
  });
  const response = await apiClient.get(`/questions?${params}`);
  return response.data;
};

// ─── Delete Question ───────────────────────────────────────────
export const deleteQuestionApi = async (questionId: string) => {
  const response = await apiClient.delete(`/questions/${questionId}`);
  return response.data;
};
// ─── Upload Questions from DOCX File ───────────────────────────
export const uploadQuestionsApi = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/upload/questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};