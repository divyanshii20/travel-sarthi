import { api } from './api';
import type { User, NotificationPreferences, VoyageCoinTransaction } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const usersService = {
  async updateProfile(body: { displayName?: string; preferredCurrency?: string }) {
    const res = await api.patch<ApiResponse<User>>('/users/profile', body);
    return res.data;
  },

  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);
    const res = await api.post<ApiResponse<{ avatarUrl: string }>>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getVoyageCoins() {
    const res = await api.get<ApiResponse<{ balance: number; transactions: VoyageCoinTransaction[] }>>(
      '/users/voyage-coins'
    );
    return res.data;
  },

  async getNotificationPreferences() {
    const res = await api.get<ApiResponse<NotificationPreferences>>('/users/notification-preferences');
    return res.data;
  },

  async updateNotificationPreferences(prefs: Partial<NotificationPreferences>) {
    const res = await api.patch<ApiResponse<NotificationPreferences>>(
      '/users/notification-preferences',
      prefs
    );
    return res.data;
  },

  async deleteAccount() {
    const res = await api.delete<ApiResponse<{ message: string }>>('/users/account');
    return res.data;
  },
};
