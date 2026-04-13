import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore, type Toast as ToastItem } from '@/store/uiStore';

const icons = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-teal-500" />,
};

const borderColors = {
  success: 'border-l-green-400',
  error: 'border-l-red-400',
  warning: 'border-l-amber-400',
  info: 'border-l-teal-400',
};

function ToastItem({ toast }: { toast: ToastItem }) {
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <motion.div
      key={toast.id}
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`flex items-start gap-3 bg-white border-l-4 ${borderColors[toast.variant]} rounded-xl shadow-lg p-4 min-w-[280px] max-w-sm`}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.variant]}</span>
      <p className="flex-1 text-sm font-medium text-primary leading-snug">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-0.5 text-muted hover:text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
