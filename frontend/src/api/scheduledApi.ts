import apiClient from './axios';

// Get assigned scheduled tests for the logged-in student
export const getMyScheduledTestsApi = async () => {
  const response = await apiClient.get('/scheduled-tests/my');
  return response.data;
};

// Admin: Create Scheduled Test
export const createScheduledTestApi = async (data: any) => {
  const response = await apiClient.post('/scheduled-tests', data);
  return response.data;
};

// Admin: Create Full-Length Test with Excel Upload
export const createFullLengthTestApi = async (formData: FormData) => {
  const response = await apiClient.post('/scheduled-tests/full-length', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Admin: Get All Scheduled Tests
export const getAllScheduledTestsApi = async () => {
  const response = await apiClient.get('/scheduled-tests');
  return response.data;
};

// Admin: Delete Scheduled Test
export const deleteScheduledTestApi = async (testId: string) => {
  const response = await apiClient.delete(`/scheduled-tests/${testId}`);
  return response.data;
};


