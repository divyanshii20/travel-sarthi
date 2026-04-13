import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  isSarthiOpen: boolean;
  isNavDrawerOpen: boolean;
  activeModal: string | null;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSarthi: () => void;
  openSarthi: () => void;
  closeSarthi: () => void;
  toggleNavDrawer: () => void;
  closeNavDrawer: () => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  toasts: [],
  isSarthiOpen: false,
  isNavDrawerOpen: false,
  activeModal: null,

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    const duration = toast.duration ?? 4000;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), duration);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  toggleSarthi: () => set((state) => ({ isSarthiOpen: !state.isSarthiOpen })),
  openSarthi: () => set({ isSarthiOpen: true }),
  closeSarthi: () => set({ isSarthiOpen: false }),

  toggleNavDrawer: () =>
    set((state) => ({ isNavDrawerOpen: !state.isNavDrawerOpen })),
  closeNavDrawer: () => set({ isNavDrawerOpen: false }),

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}));
