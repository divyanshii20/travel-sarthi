import { motion } from 'framer-motion';
import { Zap, ExternalLink } from 'lucide-react';
import type { FlashDeal } from 'travel-sarthi-shared-types';
import { useCountdown } from '@/hooks/useCountdown';
import { Badge } from '@/components/ui/Badge';

interface FlashDealCardProps {
  deal: FlashDeal;
}

export function FlashDealCard({ deal }: FlashDealCardProps) {
  const { hours, minutes, seconds, isExpired } = useCountdown(deal.expiresAt);

  if (isExpired) return null;

  return (
    <motion.div
      className="card p-4 flex flex-col gap-3 border-l-4 border-l-coral"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-coral" />
          <Badge variant="coral" size="xs">FLASH DEAL</Badge>
        </div>
        <Badge variant="saffron" size="xs">{deal.savingsPercent}% OFF</Badge>
      </div>

      <div>
        <p className="font-display font-bold text-primary text-sm">{deal.title}</p>
        <p className="text-xs text-muted mt-0.5">
          {deal.origin} → {deal.destination}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-display font-bold text-saffron">
          ₹{deal.salePrice.amount.toLocaleString('en-IN')}
        </span>
        <span className="text-sm text-muted line-through">
          ₹{deal.originalPrice.amount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-1 text-xs font-semibold">
        <span className="text-muted">Expires in:</span>
        <span className="bg-primary text-white px-1.5 py-0.5 rounded">{String(hours).padStart(2, '0')}</span>
        <span className="text-muted">:</span>
        <span className="bg-primary text-white px-1.5 py-0.5 rounded">{String(minutes).padStart(2, '0')}</span>
        <span className="text-muted">:</span>
        <span className="bg-primary text-white px-1.5 py-0.5 rounded">{String(seconds).padStart(2, '0')}</span>
      </div>

      {deal.seatsLeft != null && (
        <p className="text-xs text-coral font-semibold">{deal.seatsLeft} seats left!</p>
      )}

      <a
        href={deal.deeplink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full justify-center text-sm py-2"
      >
        Book Now <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}
