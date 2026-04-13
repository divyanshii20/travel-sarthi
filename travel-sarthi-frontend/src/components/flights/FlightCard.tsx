import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, Plane } from 'lucide-react';
import type { FlightResult, PlatformPrice, BankOffer, CouponOffer } from 'travel-sarthi-shared-types';
import { Badge } from '@/components/ui/Badge';
import { PriceBadge } from '@/components/prediction/PriceBadge';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getAirlineName } from '@/constants/airlines';

interface FlightCardProps {
  flight: FlightResult;
}

export function FlightCard({ flight }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const cheapest = flight.prices.reduce(
    (min: PlatformPrice, p: PlatformPrice) =>
      p.price.amount < min.price.amount ? p : min
  );

  const hours = Math.floor(flight.totalDuration / 60);
  const mins = flight.totalDuration % 60;

  const firstSeg = flight.segments[0];
  const lastSeg = flight.segments[flight.segments.length - 1];

  if (firstSeg == null || lastSeg == null) return null;

  const airlineName = getAirlineName(firstSeg.airline.iataCode);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Main row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
        {/* Airline */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center">
            <Plane size={16} className="text-saffron" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{airlineName}</p>
            <p className="text-xs text-muted">{firstSeg.flightNumber}</p>
          </div>
        </div>

        {/* Route & time */}
        <div className="flex items-center gap-3 flex-1">
          <div className="text-center">
            <p className="text-base font-bold text-primary">
              {new Date(firstSeg.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted">{firstSeg.departureAirport.iataCode}</p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-muted">{hours}h {mins}m</p>
            <div className="flex items-center gap-1 w-full">
              <div className="flex-1 h-px bg-card" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted" />
              <div className="flex-1 h-px bg-card" />
            </div>
            <p className="text-xs text-muted">
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-primary">
              {new Date(lastSeg.arrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted">{lastSeg.arrivalAirport.iataCode}</p>
          </div>
        </div>

        {/* Price + badges */}
        <div className="flex flex-col items-end gap-2 min-w-[130px]">
          <div className="text-right">
            <p className="text-xl font-display font-bold text-primary">
              ₹{cheapest.price.amount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted">per person · {cheapest.platform}</p>
          </div>
          {flight.farePrediction != null && (
            <PriceBadge signal={flight.farePrediction.signal} size="sm" />
          )}
          <Badge variant="teal" size="xs">
            ★ {flight.voyageScore.overall.toFixed(0)} VoyageScore
          </Badge>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-2 rounded-lg hover:bg-card transition-colors text-muted hover:text-primary"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded: platform prices table */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-card"
          >
            <div className="p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">
                Compare Prices Across Platforms
              </p>
              <div className="flex flex-col gap-2">
                {flight.prices.map((pp: PlatformPrice) => (
                  <div
                    key={pp.platform}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-card"
                  >
                    <span className="text-sm font-semibold text-primary w-28">{pp.platform}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">
                        ₹{pp.price.amount.toLocaleString('en-IN')}
                      </span>
                      <a
                        href={pp.deeplink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-saffron font-semibold hover:underline"
                      >
                        Book <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupons */}
              {flight.coupons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {flight.coupons.map((coupon: CouponOffer, i: number) => (
                    <button
                      key={i}
                      onClick={() => void copy(coupon.code)}
                      className="flex items-center gap-1 text-xs text-teal font-semibold badge bg-teal-50 border-teal-100"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {coupon.code} — {coupon.description}
                    </button>
                  ))}
                </div>
              )}

              {/* Bank offers */}
              {flight.bankOffers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {flight.bankOffers.map((offer: BankOffer, i: number) => (
                    <Badge key={i} variant="gold" size="xs">
                      🏦 {offer.bankName}: {offer.discountPercent}% off
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
