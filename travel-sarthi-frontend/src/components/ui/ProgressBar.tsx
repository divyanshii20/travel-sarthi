import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, color = 'bg-saffron', height = 6, className = '', showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      <div
        className="flex-1 bg-card rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      {showLabel === true && (
        <span className="text-xs font-semibold text-muted w-8 text-right">{clamped}%</span>
      )}
    </div>
  );
}
