import { useUIStore, type ToastVariant } from '@/store/uiStore';

export function useToast() {
  const addToast = useUIStore((s) => s.addToast);

  return {
    toast: (message: string, variant: ToastVariant = 'info', duration?: number) => {
      if (duration !== undefined) {
        addToast({ message, variant, duration });
      } else {
        addToast({ message, variant });
      }
    },
    success: (message: string) => addToast({ message, variant: 'success' }),
    error: (message: string) => addToast({ message, variant: 'error' }),
    warning: (message: string) => addToast({ message, variant: 'warning' }),
    info: (message: string) => addToast({ message, variant: 'info' }),
  };
}
