import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'right' | 'bottom';
}

export function Drawer({ isOpen, onClose, title, children, side = 'right' }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const drawerVariants =
    side === 'right'
      ? { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1 } }
      : { hidden: { y: '100%', opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const drawerClasses =
    side === 'right'
      ? 'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50'
      : 'fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-h-[90vh] overflow-y-auto';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={drawerClasses}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center justify-between p-5 border-b border-card sticky top-0 bg-white">
              {title != null && <h3 className="text-lg font-display font-bold text-primary">{title}</h3>}
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
