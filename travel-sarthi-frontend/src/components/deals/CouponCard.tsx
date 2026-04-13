import { Copy, Check } from 'lucide-react';
import type { Coupon } from 'travel-sarthi-shared-types';
import { Badge } from '@/components/ui/Badge';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface CouponCardProps {
  coupon: Coupon;
}

export function CouponCard({ coupon }: CouponCardProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-primary text-sm">{coupon.title}</p>
          {coupon.platform != null && (
            <p className="text-xs text-muted mt-0.5">via {coupon.platform}</p>
          )}
        </div>
        <Badge variant={coupon.bankName != null ? 'gold' : 'teal'} size="xs">
          {coupon.category}
        </Badge>
      </div>

      {/* Dashed code box */}
      <div
        className="flex items-center justify-between border-2 border-dashed border-saffron-100 bg-saffron-50 rounded-xl px-4 py-2.5 cursor-pointer hover:border-saffron transition-colors"
        onClick={() => void copy(coupon.code)}
      >
        <span className="font-display font-bold text-saffron tracking-widest text-sm">
          {coupon.code}
        </span>
        <button className="text-saffron hover:text-saffron-600 transition-colors">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <p className="text-xs text-secondary leading-relaxed">{coupon.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {coupon.isStackable && (
          <Badge variant="green" size="xs">Stackable</Badge>
        )}
        {coupon.minPurchase != null && (
          <Badge variant="muted" size="xs">Min ₹{coupon.minPurchase.amount.toLocaleString('en-IN')}</Badge>
        )}
        {coupon.maxDiscount != null && (
          <Badge variant="muted" size="xs">Max ₹{coupon.maxDiscount.amount.toLocaleString('en-IN')}</Badge>
        )}
      </div>
    </div>
  );
}
