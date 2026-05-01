import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Auth-expiry handler ──────────────────────────────────────────────────────
// The api.ts interceptor dispatches 'auth:logout' when an access-token refresh
// fails (e.g. refresh token revoked / expired / server restarted).
// We must:
//   1. clear the React Query cache (stale data tied to old user)
//   2. clear the auth store (so navbar shows Sign In / Get Started again)
//   3. open the sign-in modal with a toast so the user knows what happened
// Without (2)+(3), the UI thinks the user is still logged in and every
// subsequent API call returns 401 — exactly what the user reported.
let lastLogoutAt = 0;
window.addEventListener('auth:logout', () => {
  // Debounce — multiple parallel API calls can fire this at once
  const now = Date.now();
  if (now - lastLogoutAt < 1500) return;
  lastLogoutAt = now;

  void queryClient.clear();
  useAuthStore.getState().clearAuth();

  const ui = useUIStore.getState();
  // Only nag the user if they were actually authenticated
  ui.addToast({
    message: 'Your session expired. Please sign in again.',
    variant: 'warning',
    duration: 5000,
  });
  ui.openModal('auth-signin');
});

const root = document.getElementById('root');
if (root == null) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
