import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from 'travel-sarthi-shared-types';

const sampleUser: User = {
  id: 'user_1',
  email: 'riya@example.com',
  displayName: 'Riya Sharma',
  avatarUrl: null,
  preferredCurrency: 'INR',
  preferredLanguage: 'en',
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date().toISOString(),
} as unknown as User;

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it('starts unauthenticated with null user', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('setUser marks the session as authenticated', () => {
    useAuthStore.getState().setUser(sampleUser);
    const s = useAuthStore.getState();
    expect(s.user).toEqual(sampleUser);
    expect(s.isAuthenticated).toBe(true);
  });

  it('clearAuth resets user + flag', () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('updateUser merges partial onto existing user', () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().updateUser({ displayName: 'Riya S.' });
    expect(useAuthStore.getState().user?.displayName).toBe('Riya S.');
    expect(useAuthStore.getState().user?.email).toBe('riya@example.com');
  });

  it('updateUser is a no-op when user is null', () => {
    useAuthStore.getState().updateUser({ displayName: 'X' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('persists user to localStorage under "ts-auth"', () => {
    useAuthStore.getState().setUser(sampleUser);
    const raw = localStorage.getItem('ts-auth');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.user.email).toBe('riya@example.com');
    expect(parsed.state.isAuthenticated).toBe(true);
  });

  it('clears persisted state on clearAuth', () => {
    useAuthStore.getState().setUser(sampleUser);
    useAuthStore.getState().clearAuth();
    const parsed = JSON.parse(localStorage.getItem('ts-auth')!);
    expect(parsed.state.user).toBeNull();
    expect(parsed.state.isAuthenticated).toBe(false);
  });
});
