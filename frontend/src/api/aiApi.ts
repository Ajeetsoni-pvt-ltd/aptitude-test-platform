// frontend/src/api/aiApi.ts
import apiClient from './axios';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export const chatWithAIApi = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<{ success: boolean; data?: { reply: string }; message?: string }> => {
  const response = await apiClient.post('/ai/chat', {
    message,
    conversationHistory: conversationHistory.slice(-8), // last 4 pairs
  });
  return response.data;
};
