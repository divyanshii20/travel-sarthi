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
      className="overflow-hidden group cursor-pointer relative"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,98,42,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
      }}
    >
      {/* ── Hero Image ── */}
      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <img
          src={imgSrc}
          alt={dest.heroImage.alt || dest.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
        {/* Gradient overlay — cinematic vignette */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.12) 100%)' }} />

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

      {/* Saffron accent line */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(to right, var(--color-saffron), var(--color-gold), transparent)' }} />

      {/* ── Card Body ── */}
      <div className="p-4 pt-3.5 flex flex-col gap-2.5">
        {/* Flag + name + country */}
        <div>
          <p className="text-sm font-display font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {dest.flagEmoji != null && dest.flagEmoji.length > 0 && (
              <span className="mr-1.5">{dest.flagEmoji}</span>
            )}
            {dest.name}
            <span className="font-normal" style={{ color: 'var(--text-muted)' }}> · {dest.country}</span>
          </p>
          <p className="text-xs mt-1 line-clamp-1 font-serif italic" style={{ color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
            {dest.tagline}
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
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>from</p>
            <p className="font-display font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.2 }}>
              <span style={{ color: 'var(--color-saffron)' }}>₹</span>{budget != null ? budget.toLocaleString('en-IN') : '—'}
              <span className="text-[10px] font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>/day</span>
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

      {/* ── Hover overlay with slide-up transition ── */}
      <div
        className="absolute inset-0 z-20 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none group-hover:pointer-events-auto"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        {/* Glass backdrop */}
        <div className="absolute inset-0" style={{ background: 'rgba(15,15,18,0.78)', backdropFilter: 'blur(4px)', borderRadius: 'var(--radius-lg)' }} />

        {/* Content slides up */}
        <div className="relative p-5 pb-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-400 ease-out">
          {/* Gold accent */}
          <div className="w-8 h-0.5 rounded-full mb-3" style={{ background: 'var(--color-gold)' }} />

          <p className="text-white font-display font-bold text-base mb-3 tracking-tight">Highlights</p>
          <div className="flex flex-col gap-2 mb-5">
            {dest.highlights.length > 0 ? dest.highlights.slice(0, 3).map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: 'var(--color-saffron)' }}
                />
                <p className="text-white/75 text-xs leading-relaxed">{h.title}</p>
              </div>
            )) : (
              <p className="text-white/50 text-xs italic">Explore this destination to discover its hidden wonders</p>
            )}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl transition-all pointer-events-auto"
            style={{
              background: 'linear-gradient(135deg, var(--color-saffron), #E8622A)',
              boxShadow: '0 4px 16px rgba(232,98,42,0.3)',
            }}
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
