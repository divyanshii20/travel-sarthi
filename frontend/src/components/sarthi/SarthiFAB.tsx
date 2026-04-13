import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function SarthiFAB() {
  const { isSarthiOpen, toggleSarthi } = useUIStore();

  return (
    <motion.button
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-saffron"
      style={{ background: 'linear-gradient(135deg, var(--color-saffron), var(--color-gold))' }}
      onClick={toggleSarthi}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Open Sarthi AI chat"
    >
      {/* Pulse ring */}
      {!isSarthiOpen && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'inherit',
            animation: 'pulse-ring 1.5s ease-out infinite',
            zIndex: -1,
          }}
        />
      )}
      <AnimatePresence mode="wait">
        {isSarthiOpen ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X size={22} />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MessageCircle size={22} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
