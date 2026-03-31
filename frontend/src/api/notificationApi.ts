import apiClient from './axios';

export const getMyNotificationsApi = async () => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

export const markNotificationAsReadApi = async (id: string) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsReadApi = async () => {
  const response = await apiClient.patch('/notifications/mark-all-read');
  return response.data;
};
