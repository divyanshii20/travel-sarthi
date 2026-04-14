import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plane, Plus, Check, Shield, Sun, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import type { Destination } from 'travel-sarthi-shared-types';
import { ProgressBar } from '@/components/ui/ProgressBar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';

function formatBestMonths(months: number[]): string {
  if (months.length === 0) return '';
  if (months.length === 1) return MONTHS[months[0] - 1];
  const names = months.map((m) => MONTHS[m - 1]);
  return `${names[0]} – ${names[names.length - 1]}`;
}

function getVisaLabel(type: string): { label: string; color: string } {
  switch (type) {
    case 'visa_free': return { label: 'Visa Free ✓', color: '#16a34a' };
    case 'visa_on_arrival': return { label: 'On Arrival', color: '#d97706' };
    case 'e_visa': return { label: 'E-Visa', color: '#2563eb' };
    default: return { label: 'Visa Required', color: '#dc2626' };
  }
}

interface DestinationCardProps {
  destination: Destination;
  rank?: number;
  onCompare?: (d: Destination) => void;
  onViewDetails?: (d: Destination) => void;
  isInCompare?: boolean;
}

export function DestinationCard({ destination: dest, rank, onCompare, onViewDetails, isInCompare }: DestinationCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgSrc, setImgSrc] = useState(dest.heroImage.url);

  const visa = getVisaLabel(dest.visa.type);
  const budget = dest.budgetMidPerDay ?? dest.budgetPerDay;
  const bestMonthsStr = formatBestMonths(dest.bestMonths);
  const safetyPct = Math.min(100, dest.score.safety * 10);
  const weatherPct = Math.min(100, dest.score.weatherScore * 10);

  return (
    <motion.div
      className="card overflow-hidden group cursor-pointer relative"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      {/* ── Hero Image ── */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <img
          src={imgSrc}
          alt={dest.heroImage.alt || dest.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Wishlist button */}
        <button
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { e.stopPropagation(); setIsWishlisted((w) => !w); }}
          aria-label="Add to wishlist"
        >
          <Heart
            size={15}
            fill={isWishlisted ? '#E85555' : 'none'}
            color={isWishlisted ? '#E85555' : 'white'}
          />
        </button>

        {/* Rank badge + trending */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {rank != null && rank <= 10 && (
            <span
              className="text-white text-xs font-display font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-saffron)', fontSize: 11 }}
            >
              #{rank}
            </span>
          )}
          {dest.isTrending && dest.trendingChangePct > 0 && (
            <span
              className="text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(22,163,74,0.85)', backdropFilter: 'blur(6px)', fontSize: 11 }}
            >
              <TrendingUp size={11} />
              +{Math.round(dest.trendingChangePct)}%
            </span>
          )}
        </div>

        {/* Visa pill at bottom of image */}
        <div className="absolute bottom-3 left-3">
          <span
            className="text-white text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: `${visa.color}CC`, backdropFilter: 'blur(6px)', fontSize: 11 }}
          >
            {visa.label}
          </span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Flag + name + country */}
        <div>
          <p className="text-sm font-display font-bold text-primary leading-tight">
            {dest.flagEmoji != null && dest.flagEmoji.length > 0 && (
              <span className="mr-1">{dest.flagEmoji}</span>
            )}
            {dest.name}
            <span className="text-muted font-normal"> · {dest.country}</span>
          </p>
          <p className="text-xs italic mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            "{dest.tagline}"
          </p>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Scores */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Shield size={11} style={{ color: 'var(--color-teal)' }} className="shrink-0" />
            <span className="text-xs text-muted w-12 shrink-0">Safety</span>
            <ProgressBar value={safetyPct} color="bg-teal" height={5} />
            <span className="text-xs font-semibold text-primary w-6 text-right shrink-0">{dest.score.safety}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun size={11} style={{ color: 'var(--color-gold)' }} className="shrink-0" />
            <span className="text-xs text-muted w-12 shrink-0">Weather</span>
            <ProgressBar value={weatherPct} color="bg-amber-400" height={5} />
            <span className="text-xs font-semibold text-primary w-6 text-right shrink-0">{dest.score.weatherScore}</span>
          </div>
        </div>

        {/* Direct flights */}
        {dest.directFlightCities.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Plane size={11} className="shrink-0" />
            <span className="truncate">Direct: {dest.directFlightCities.slice(0, 2).join(', ')}</span>
          </div>
        )}

        {/* Best months */}
        {bestMonthsStr.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Calendar size={11} className="shrink-0" />
            <span>Best: {bestMonthsStr}</span>
          </div>
        )}

        {/* Divider */}
        <div className="divider" />

        {/* Budget + CTAs */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>From</p>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              ₹{budget != null ? budget.toLocaleString('en-IN') : '—'}
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/day</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {onCompare != null && (
              <button
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all"
                style={{
                  background: isInCompare === true ? 'rgba(10,107,102,0.12)' : 'var(--bg-surface)',
                  color: isInCompare === true ? 'var(--color-teal)' : 'var(--text-secondary)',
                  border: `1px solid ${isInCompare === true ? 'var(--color-teal)' : 'var(--border-card)'}`,
                }}
                onClick={(e) => { e.stopPropagation(); onCompare(dest); }}
              >
                {isInCompare === true ? <Check size={12} /> : <Plus size={12} />}
                Compare
              </button>
            )}
            <button
              className="btn-primary text-xs px-3 py-1.5 gap-1"
              style={{ borderRadius: 10, fontSize: 12, padding: '6px 12px' }}
              onClick={(e) => { e.stopPropagation(); if (onViewDetails != null) onViewDetails(dest); }}
            >
              Plan Trip
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Hover Panel (highlights) ── */}
      <AnimatePresence>
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
          initial={{ opacity: 0, y: 8 }}
          whileHover={{ opacity: 1, y: 0 }}
          style={{ display: 'none' }}
        />
      </AnimatePresence>

      {/* Hover overlay — shown via CSS group-hover */}
      <div
        className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
        style={{ background: 'rgba(17,17,24,0.82)', borderRadius: 'var(--radius-lg)' }}
      >
        <div className="p-4 pb-5">
          <p className="text-white font-display font-bold text-base mb-2">Highlights</p>
          <div className="flex flex-col gap-1.5 mb-4">
            {dest.highlights.slice(0, 3).map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: 'var(--color-saffron)' }}
                />
                <p className="text-white/80 text-xs leading-relaxed">{h.title}</p>
              </div>
            ))}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all pointer-events-auto"
            style={{ background: 'var(--color-saffron)' }}
            onClick={() => { if (onViewDetails != null) onViewDetails(dest); }}
          >
            View Details
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
