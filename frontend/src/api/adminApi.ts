import apiClient from './axios';
import type { ApiResponse, Question } from '@/types';

export interface BulkUploadRowPreview {
  rowNumber: number;
  status: 'valid' | 'invalid';
  issues: string[];
  question?: Question;
}

export interface BulkUploadResult {
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    savedRows: number;
  };
  rows: BulkUploadRowPreview[];
  questionIds: string[];
}

export interface BulkDeleteQuestionsResult {
  matchedCount: number;
  deletedCount: number;
  blockedCount: number;
  scope: {
    topic: string;
    subtopic: string | null;
    difficulty: string | null;
  };
}

export const getAdminStatsApi = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

export const getAllUsersApi = async (page = 1, limit = 10, search = '') => {
  const response = await apiClient.get(
    `/admin/users?page=${page}&limit=${limit}&search=${search}`
  );
  return response.data;
};

export const updateUserRoleApi = async (userId: string, role: string) => {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUserApi = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

export const toggleUserStatusApi = async (userId: string) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`);
  return response.data;
};

export const getStudentAnalyticsApi = async (userId: string) => {
  const response = await apiClient.get(`/admin/students/${userId}/analytics`);
  return response.data;
};


export const getQuestionsAdminApi = async (
  page = 1,
  limit = 50,
  topic = '',
  difficulty = '',
  questionType = '',
  subtopic = ''
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(topic && { topic }),
    ...(subtopic && { subtopic }),
    ...(difficulty && { difficulty }),
    ...(questionType && { questionType }),
  });
  const response = await apiClient.get(`/questions?${params}`);
  return response.data;
};

export const deleteQuestionApi = async (questionId: string) => {
  const response = await apiClient.delete(`/questions/${questionId}`);
  return response.data;
};

export const bulkDeleteQuestionsApi = async (payload: {
  topic: string;
  subtopic?: string;
  difficulty?: string;
}) => {
  const response = await apiClient.delete<ApiResponse<BulkDeleteQuestionsResult>>(
    '/questions/bulk-delete',
    {
      data: payload,
    }
  );
  return response.data;
};

export const updateQuestionApi = async (
  questionId: string,
  payload: {
    topic: string;
    subtopic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionText?: string;
    questionImage?: string;
    options: Array<{ text?: string; image?: string }>;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  }
) => {
  const response = await apiClient.put(`/questions/${questionId}`, {
    ...payload,
    options: JSON.stringify(payload.options),
  });
  return response.data;
};

export const createManualQuestionApi = async (formData: FormData) => {
  const response = await apiClient.post('/questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const buildBulkUploadFormData = (workbook: File, imagesZip?: File | null) => {
  const formData = new FormData();
  formData.append('file', workbook);
  if (imagesZip) {
    formData.append('imagesZip', imagesZip);
  }
  return formData;
};

export const previewBulkQuestionsApi = async (
  workbook: File,
  imagesZip?: File | null
) => {
  const response = await apiClient.post<ApiResponse<BulkUploadResult>>(
    '/questions/bulk-upload?mode=preview',
    buildBulkUploadFormData(workbook, imagesZip),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const confirmBulkQuestionsApi = async (
  workbook: File,
  imagesZip?: File | null
) => {
  const response = await apiClient.post<ApiResponse<BulkUploadResult>>(
    '/questions/bulk-upload?mode=confirm',
    buildBulkUploadFormData(workbook, imagesZip),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const downloadBulkTemplateApi = async () => {
  const response = await apiClient.get('/questions/bulk-template', {
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const getAllTopicsApi = async () => {
  const response = await apiClient.get('/questions/metadata/topics');
  return response.data;
};

export const getSubtopicsForTopicApi = async (topic: string) => {
  const params = new URLSearchParams({ topic });
  const response = await apiClient.get(`/questions/metadata/subtopics?${params}`);
  return response.data;
};

export const getQuestionMetadataApi = async (topic?: string) => {
  const params = new URLSearchParams();
  if (topic) {
    params.append('topic', topic);
  }
  const response = await apiClient.get(`/questions/metadata/all?${params}`);
  return response.data;
};
