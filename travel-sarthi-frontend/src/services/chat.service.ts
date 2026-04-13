import { api } from './api';
import type { ChatMessage, ChatSession, SendMessageRequestDTO, SendMessageResponseDTO } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const chatService = {
  async sendMessage(body: SendMessageRequestDTO) {
    const res = await api.post<ApiResponse<SendMessageResponseDTO>>('/sarthi/send', body);
    return res.data;
  },

  async getSessions() {
    const res = await api.get<ApiResponse<ChatSession[]>>('/sarthi/sessions');
    return res.data;
  },

  async getSessionMessages(sessionId: string) {
    const res = await api.get<ApiResponse<ChatMessage[]>>(`/sarthi/sessions/${sessionId}/messages`);
    return res.data;
  },
};
