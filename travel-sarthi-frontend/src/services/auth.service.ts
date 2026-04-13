import { api, setTokens, clearTokens } from './api';
import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  SetupTotpResponseDTO,
} from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const authService = {
  async register(body: RegisterRequestDTO) {
    const res = await api.post<ApiResponse<AuthResponseDTO>>('/auth/register', body);
    if (res.data.data != null) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },

  async login(body: LoginRequestDTO) {
    const res = await api.post<ApiResponse<AuthResponseDTO>>('/auth/login', body);
    if (res.data.data != null) {
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async getMe() {
    const res = await api.get<ApiResponse<AuthResponseDTO['user']>>('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password });
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
    return res.data;
  },

  async setupTotp() {
    const res = await api.post<ApiResponse<SetupTotpResponseDTO>>('/auth/totp/setup');
    return res.data;
  },

  async enableTotp(totpCode: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/totp/enable', { totpCode });
    return res.data;
  },

  async disableTotp(totpCode: string) {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/totp/disable', { totpCode });
    return res.data;
  },

  googleOAuthUrl() {
    return `${import.meta.env['VITE_API_BASE_URL'] ?? '/api'}/auth/google`;
  },
};
