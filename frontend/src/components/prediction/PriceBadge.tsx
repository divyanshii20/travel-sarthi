import { motion } from 'framer-motion';
import type { PricePredictionSignal } from 'travel-sarthi-shared-types';

interface PriceBadgeProps {
  signal: PricePredictionSignal;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

const signalConfig: Record<
  PricePredictionSignal,
  { label: string; emoji: string; bg: string; text: string; border: string }
> = {
  BUY_NOW: {
    label: 'BUY NOW',
    emoji: '🔴',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  WAIT: {
    label: 'WAIT',
    emoji: '🟡',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  FLEXIBLE: {
    label: 'FLEXIBLE',
    emoji: '🟢',
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  WATCH: {
    label: 'WATCH',
    emoji: '🟠',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  STABLE: {
    label: 'STABLE',
    emoji: '⚪',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

export function PriceBadge({ signal, confidence, size = 'md' }: PriceBadgeProps) {
  const cfg = signalConfig[signal as keyof typeof signalConfig]!;

  return (
    <motion.span
      className={`inline-flex items-center font-bold rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses[size] ?? ''}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
      {confidence != null && (
        <span className="opacity-60 font-normal text-[10px]">({Math.round(confidence * 100)}%)</span>
      )}
    </motion.span>
  );
}
