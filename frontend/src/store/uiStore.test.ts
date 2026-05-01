import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      toasts: [],
      isSarthiOpen: false,
      isNavDrawerOpen: false,
      activeModal: null,
    });
  });

  // Modals
  describe('modals', () => {
    it('opens a modal by name', () => {
      useUIStore.getState().openModal('auth-signin');
      expect(useUIStore.getState().activeModal).toBe('auth-signin');
    });

    it('switches between modal names', () => {
      useUIStore.getState().openModal('auth-signin');
      useUIStore.getState().openModal('auth-signup');
      expect(useUIStore.getState().activeModal).toBe('auth-signup');
    });

    it('closes the modal', () => {
      useUIStore.getState().openModal('auth-signin');
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });

  // Sarthi chat
  describe('Sarthi chat panel', () => {
    it('starts closed', () => {
      expect(useUIStore.getState().isSarthiOpen).toBe(false);
    });

    it('toggleSarthi flips the flag', () => {
      useUIStore.getState().toggleSarthi();
      expect(useUIStore.getState().isSarthiOpen).toBe(true);
      useUIStore.getState().toggleSarthi();
      expect(useUIStore.getState().isSarthiOpen).toBe(false);
    });

    it('openSarthi/closeSarthi set the flag explicitly', () => {
      useUIStore.getState().openSarthi();
      expect(useUIStore.getState().isSarthiOpen).toBe(true);
      useUIStore.getState().closeSarthi();
      expect(useUIStore.getState().isSarthiOpen).toBe(false);
    });
  });

  // Nav drawer
  describe('mobile nav drawer', () => {
    it('toggleNavDrawer flips the flag', () => {
      useUIStore.getState().toggleNavDrawer();
      expect(useUIStore.getState().isNavDrawerOpen).toBe(true);
      useUIStore.getState().toggleNavDrawer();
      expect(useUIStore.getState().isNavDrawerOpen).toBe(false);
    });

    it('closeNavDrawer always closes', () => {
      useUIStore.setState({ isNavDrawerOpen: true });
      useUIStore.getState().closeNavDrawer();
      expect(useUIStore.getState().isNavDrawerOpen).toBe(false);
    });
  });

  // Toasts
  describe('toasts', () => {
    it('addToast assigns a unique id', () => {
      useUIStore.getState().addToast({ message: 'Hi', variant: 'success' });
      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.id).toBeTruthy();
      expect(toasts[0]?.message).toBe('Hi');
    });

    it('addToast supports multiple toasts simultaneously', () => {
      useUIStore.getState().addToast({ message: 'A', variant: 'info' });
      useUIStore.getState().addToast({ message: 'B', variant: 'error' });
      expect(useUIStore.getState().toasts).toHaveLength(2);
    });

    it('removeToast removes by id', () => {
      useUIStore.getState().addToast({ message: 'X', variant: 'success' });
      const id = useUIStore.getState().toasts[0]!.id;
      useUIStore.getState().removeToast(id);
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('auto-removes toast after duration via setTimeout', () => {
      vi.useFakeTimers();
      useUIStore.getState().addToast({ message: 'Auto', variant: 'success', duration: 1000 });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      vi.advanceTimersByTime(1100);
      expect(useUIStore.getState().toasts).toHaveLength(0);
      vi.useRealTimers();
    });

    it('supports all four variants', () => {
      const variants = ['success', 'error', 'warning', 'info'] as const;
      for (const v of variants) {
        useUIStore.getState().addToast({ message: v, variant: v });
      }
      expect(useUIStore.getState().toasts.map((t) => t.variant)).toEqual(variants);
    });
  });
});
