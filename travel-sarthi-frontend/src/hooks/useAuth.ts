import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { clearTokens } from '@/services/api';
import type { LoginRequestDTO, RegisterRequestDTO } from 'travel-sarthi-shared-types';

export function useAuth() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (body: LoginRequestDTO) => {
      const res = await authService.login(body);
      if (res.data != null) {
        setUser(res.data.user);
        navigate('/');
      }
      return res;
    },
    [setUser, navigate]
  );

  const register = useCallback(
    async (body: RegisterRequestDTO) => {
      const res = await authService.register(body);
      if (res.data != null) {
        setUser(res.data.user);
        navigate('/');
      }
      return res;
    },
    [setUser, navigate]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuth();
    clearTokens();
    navigate('/login');
  }, [clearAuth, navigate]);

  return { user, isAuthenticated, login, register, logout };
}
