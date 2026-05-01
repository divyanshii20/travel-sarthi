import { describe, it, expect, beforeEach } from 'vitest';
import { setTokens, clearTokens, getAccessToken, extractApiError } from './api';

describe('api token helpers', () => {
  beforeEach(() => localStorage.clear());

  it('setTokens stores access + refresh', () => {
    setTokens('a-token', 'r-token');
    expect(localStorage.getItem('access_token')).toBe('a-token');
    expect(localStorage.getItem('refresh_token')).toBe('r-token');
  });

  it('getAccessToken returns the stored access token', () => {
    setTokens('a-token', 'r-token');
    expect(getAccessToken()).toBe('a-token');
  });

  it('getAccessToken returns null when nothing stored', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('clearTokens removes both tokens', () => {
    setTokens('a', 'b');
    clearTokens();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('extractApiError', () => {
  it('handles native Error', () => {
    expect(extractApiError(new Error('boom'))).toBe('boom');
  });

  it('falls back to default for unknown shapes', () => {
    expect(extractApiError(42)).toBe('An unexpected error occurred');
    expect(extractApiError(null)).toBe('An unexpected error occurred');
    expect(extractApiError(undefined)).toBe('An unexpected error occurred');
  });

  it('extracts axios-style nested error.message', () => {
    // Mimics axios shape including isAxiosError flag
    const err = {
      isAxiosError: true,
      message: 'Network',
      response: { data: { error: { message: 'Invalid credentials' } } },
    };
    // axios.isAxiosError checks the flag; works in jsdom
    expect(extractApiError(err)).toBe('Invalid credentials');
  });

  it('falls back to axios message when nested error.message missing', () => {
    const err = {
      isAxiosError: true,
      message: 'Network Error',
      response: { data: {} },
    };
    expect(extractApiError(err)).toBe('Network Error');
  });
});
