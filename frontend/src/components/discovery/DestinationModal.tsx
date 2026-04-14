import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronLeft, ChevronRight, Heart, Plus, Check,
  Shield, Sun, Building2, Star, Plane, Calendar,
  MapPin, Utensils, Tag, CheckCircle,
} from 'lucide-react';
import type { Destination } from 'travel-sarthi-shared-types';
import { ProgressBar } from '@/components/ui/ProgressBar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FALLBACK = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80';

function getVisaStyle(type: string): { label: string; bg: string; color: string } {
  switch (type) {
    case 'visa_free': return { label: 'Visa Free ✓', bg: '#dcfce7', color: '#16a34a' };
    case 'visa_on_arrival': return { label: 'On Arrival', bg: '#fef3c7', color: '#d97706' };
    case 'e_visa': return { label: 'E-Visa', bg: '#dbeafe', color: '#2563eb' };
    default: return { label: 'Visa Required', bg: '#fee2e2', color: '#dc2626' };
  }
}

interface DestinationModalProps {
  destination: Destination | null;
  onClose: () => void;
  onCompare: (d: Destination) => void;
  isInCompare?: boolean;
}

export function DestinationModal({ destination, onClose, onCompare, isInCompare }: DestinationModalProps) {
  const navigate = useNavigate();
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const isOpen = destination != null;

  const handleClose = useCallback(() => {
    onClose();
    setGalleryIdx(0);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') setGalleryIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight' && destination != null) {
        const imgs = [destination.heroImage.url, ...destination.galleryImages];
        setGalleryIdx((i) => Math.min(imgs.length - 1, i + 1));
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose, destination]);

  if (destination == null) return null;

  const allImages = [destination.heroImage.url, ...destination.galleryImages].filter(Boolean);
  const visa = getVisaStyle(destination.visa.type);
  const budget = destination.budget;

  const monthPillColor = (month: number): { bg: string; color: string; fw: string } => {
    if (destination.bestMonths.includes(month)) return { bg: 'rgba(232,98,42,0.15)', color: 'var(--color-saffron)', fw: '700' };
    if (destination.peakMonths.includes(month)) return { bg: 'rgba(201,151,74,0.15)', color: 'var(--color-gold)', fw: '600' };
    if (destination.avoidMonths.includes(month)) return { bg: 'rgba(232,85,85,0.12)', color: 'var(--color-coral)', fw: '600' };
    return { bg: 'var(--bg-surface)', color: 'var(--text-muted)', fw: '400' };
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal panel */}
          <motion.div
            className="relative w-full flex flex-col lg:flex-row bg-white overflow-hidden z-10"
            style={{
              maxWidth: 1100,
              maxHeight: '92vh',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(17,17,24,0.55)', backdropFilter: 'blur(8px)' }}
            >
              <X size={18} color="white" />
            </button>

            {/* LEFT: Gallery */}
            <div className="lg:w-[55%] flex flex-col" style={{ background: '#000' }}>
              {/* Main image */}
              <div className="relative flex-1 min-h-[280px] lg:min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={galleryIdx}
                    src={allImages[galleryIdx] ?? FALLBACK}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                    style={{ minHeight: 280 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onError={(e) => { e.currentTarget.src = FALLBACK; }}
                  />
                </AnimatePresence>

                {/* Nav arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                      style={{ background: 'rgba(17,17,24,0.55)', backdropFilter: 'blur(6px)' }}
                      onClick={() => setGalleryIdx((i) => Math.max(0, i - 1))}
                      disabled={galleryIdx === 0}
                    >
                      <ChevronLeft size={18} color="white" />
                    </button>
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                      style={{ background: 'rgba(17,17,24,0.55)', backdropFilter: 'blur(6px)' }}
                      onClick={() => setGalleryIdx((i) => Math.min(allImages.length - 1, i + 1))}
                      disabled={galleryIdx === allImages.length - 1}
                    >
                      <ChevronRight size={18} color="white" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div
                  className="absolute bottom-3 right-3 text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(17,17,24,0.55)', backdropFilter: 'blur(6px)' }}
                >
                  {galleryIdx + 1} / {allImages.length}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide" style={{ background: '#111' }}>
                  {allImages.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIdx(i)}
                      className="shrink-0 rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 68,
                        height: 48,
                        border: `2px solid ${i === galleryIdx ? 'var(--color-saffron)' : 'transparent'}`,
                        opacity: i === galleryIdx ? 1 : 0.55,
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Details */}
            <div
              className="lg:w-[45%] flex flex-col overflow-y-auto"
              style={{ maxHeight: '92vh', scrollbarWidth: 'thin' }}
            >
              <div className="p-6 flex flex-col gap-5">
                {/* Title */}
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={11} className="inline mr-1" />
                    {destination.country}
                    {destination.stateProvince != null && ` · ${destination.stateProvince}`}
                    {destination.continent != null && ` · ${destination.continent}`}
                  </p>
                  <h2 className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {destination.flagEmoji != null && <span className="mr-2">{destination.flagEmoji}</span>}
                    {destination.name}
                  </h2>
                  <p className="text-sm italic mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    "{destination.tagline}"
                  </p>
                </div>

                {/* Visa + budget row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: visa.bg, color: visa.color }}
                  >
                    {visa.label}
                    {destination.visa.fee != null && ` · $${destination.visa.fee}`}
                  </span>
                  {destination.visa.notes != null && destination.visa.notes.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{destination.visa.notes}</span>
                  )}
                  {destination.score.badge != null && destination.score.badge.length > 0 && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(201,151,74,0.15)', color: 'var(--color-gold)' }}
                    >
                      {destination.score.badge}
                    </span>
                  )}
                </div>

                {/* Scores 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, label: 'Safety', val: destination.score.safety * 10, color: 'bg-teal', accent: 'var(--color-teal)' },
                    { icon: Sun, label: 'Weather', val: destination.score.weatherScore * 10, color: 'bg-amber-400', accent: 'var(--color-gold)' },
                    { icon: Building2, label: 'Infrastructure', val: destination.infrastructureScore, color: 'bg-blue-400', accent: '#3b82f6' },
                    { icon: Star, label: 'Value', val: destination.valueScore, color: 'bg-purple-400', accent: '#9333ea' },
                  ].map(({ icon: Icon, label, val, color, accent }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl flex flex-col gap-1.5"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} color={accent} />
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </div>
                        <span className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                          {Math.round(val)}
                        </span>
                      </div>
                      <ProgressBar value={val} color={color} height={4} />
                    </div>
                  ))}
                </div>

                {/* Budget tiers */}
                <div className="rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)' }}>
                  <p className="text-xs font-bold mb-2.5" style={{ color: 'var(--text-secondary)' }}>Budget per Day</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Budget</p>
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        ₹{budget.budget.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-card)', borderRight: '1px solid var(--border-card)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mid</p>
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--color-saffron)' }}>
                        ₹{budget.comfort.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Luxury</p>
                      <p className="font-display font-bold text-sm" style={{ color: 'var(--color-gold)' }}>
                        ₹{budget.luxury.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best time calendar */}
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={12} className="inline mr-1" />
                    Best Time to Visit
                  </p>
                  <div className="grid grid-cols-6 gap-1">
                    {MONTHS.map((m, i) => {
                      const { bg, color, fw } = monthPillColor(i + 1);
                      return (
                        <span
                          key={m}
                          className="text-center text-xs py-1.5 rounded-lg"
                          style={{ background: bg, color, fontWeight: fw, fontSize: 11 }}
                        >
                          {m}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {[
                      { dot: 'var(--color-saffron)', label: 'Best' },
                      { dot: 'var(--color-gold)', label: 'Peak' },
                      { dot: 'var(--color-coral)', label: 'Avoid' },
                    ].map(({ dot, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                {destination.highlights.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle size={12} className="inline mr-1" />
                      Highlights
                    </p>
                    <div className="flex flex-col gap-2">
                      {destination.highlights.slice(0, 4).map((h, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold mt-0.5"
                            style={{ background: 'var(--color-saffron)', fontSize: 10 }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{h.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{h.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cuisine */}
                {destination.cuisineHighlights.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      <Utensils size={12} className="inline mr-1" />
                      Food & Cuisine
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.cuisineHighlights.map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(139,94,60,0.10)', color: '#8B5E3C', border: '1px solid rgba(139,94,60,0.15)' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {destination.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                      <Tag size={12} className="inline mr-1" />
                      Vibes & Activities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct flights */}
                {destination.directFlightCities.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Plane size={12} className="inline mr-1" />
                      Direct Flights From
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.directFlightCities.map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(10,107,102,0.08)', color: 'var(--color-teal)', border: '1px solid rgba(10,107,102,0.15)' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby */}
                {destination.nearbyDestinations.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nearby Destinations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {destination.nearbyDestinations.map((slug) => (
                        <button
                          key={slug}
                          className="text-xs px-2.5 py-1 rounded-full transition-all hover:bg-saffron hover:text-white"
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)' }}
                          onClick={() => navigate(`/discover/${slug}`)}
                        >
                          {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ideal duration */}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ideal trip: {destination.idealDurationMin}–{destination.idealDurationMax} days
                  {destination.weatherSummary != null && ` · ${destination.weatherSummary}`}
                </p>

                {/* Spacer for sticky bar */}
                <div className="h-16" />
              </div>

              {/* Sticky bottom CTA */}
              <div
                className="sticky bottom-0 flex items-center gap-2 p-4"
                style={{
                  background: 'var(--bg-card)',
                  borderTop: '1px solid var(--border-card)',
                  boxShadow: '0 -4px 20px rgba(17,17,24,0.08)',
                }}
              >
                <button
                  onClick={() => setIsWishlisted((w) => !w)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isWishlisted ? 'rgba(232,85,85,0.1)' : 'var(--bg-surface)',
                    color: isWishlisted ? 'var(--color-coral)' : 'var(--text-secondary)',
                    border: `1px solid ${isWishlisted ? 'var(--color-coral)' : 'var(--border-card)'}`,
                  }}
                >
                  <Heart size={15} fill={isWishlisted ? 'var(--color-coral)' : 'none'} />
                  Save
                </button>

                <button
                  onClick={() => onCompare(destination)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isInCompare === true ? 'rgba(10,107,102,0.1)' : 'var(--bg-surface)',
                    color: isInCompare === true ? 'var(--color-teal)' : 'var(--text-secondary)',
                    border: `1px solid ${isInCompare === true ? 'var(--color-teal)' : 'var(--border-card)'}`,
                  }}
                >
                  {isInCompare === true ? <Check size={15} /> : <Plus size={15} />}
                  Compare
                </button>

                <button
                  className="btn-primary flex-1 text-sm gap-2"
                  style={{ borderRadius: 'var(--radius-md)', padding: '10px 16px' }}
                  onClick={() => navigate(`/plan?destination=${destination.slug}&mode=a`)}
                >
                  <Plane size={15} />
                  Plan This Trip
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
