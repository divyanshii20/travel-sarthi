import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Users, Wallet, Zap, ChevronDown, ChevronUp,
  Clock, Plane, Loader2, AlertCircle, CheckCircle2, ArrowRight, Pencil,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useGenerateItinerary } from '@/hooks/useItinerary';
import type {
  GenerateItineraryRequestDTO,
  Itinerary,
  ItineraryStyle,
  PacePreference,
} from 'travel-sarthi-shared-types';

// ─── Form Shape ───────────────────────────────────────────────────────────────

interface PlanFormValues {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budgetTotal: number;
  pace: PacePreference;
}

// ─── Style Options ────────────────────────────────────────────────────────────

const STYLES: { value: ItineraryStyle; label: string; emoji: string }[] = [
  { value: 'adventure', label: 'Adventure', emoji: '🧗' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { value: 'foodie', label: 'Foodie', emoji: '🍜' },
  { value: 'romantic', label: 'Romantic', emoji: '💑' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'budget', label: 'Budget', emoji: '💸' },
];

const PACES: { value: PacePreference; label: string; desc: string }[] = [
  { value: 'slow', label: 'Slow', desc: '2–3 activities/day' },
  { value: 'moderate', label: 'Moderate', desc: '4–5 activities/day' },
  { value: 'packed', label: 'Packed', desc: '6+ activities/day' },
];

// ─── Itinerary Display ────────────────────────────────────────────────────────

function ItineraryView({ itinerary }: { itinerary: Itinerary }) {
  const [openDay, setOpenDay] = useState<number>(1);
  const budget = itinerary.budgetBreakdown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary">{itinerary.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-secondary">
              <span className="flex items-center gap-1"><MapPin size={14} />{itinerary.destination}</span>
              <span className="flex items-center gap-1"><Calendar size={14} />{itinerary.startDate} → {itinerary.endDate}</span>
              <span className="flex items-center gap-1"><Clock size={14} />{itinerary.durationDays} days</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wide">Estimated Total</p>
            <p className="text-xl font-bold text-accent">{budget.total.formatted}</p>
            {budget.totalSavings.amount > 0 && (
              <p className="text-xs text-green-600 font-medium">Save {budget.totalSavings.formatted} with coupons</p>
            )}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(
            [
              { label: 'Flights', value: budget.flights.formatted },
              { label: 'Hotels', value: budget.accommodation.formatted },
              { label: 'Food', value: budget.food.formatted },
              { label: 'Activities', value: budget.activities.formatted },
              { label: 'Transport', value: budget.transport.formatted },
              { label: 'Misc', value: budget.miscellaneous.formatted },
            ] as const
          ).map((item) => (
            <div key={item.label} className="bg-surface rounded-xl p-2 text-center">
              <p className="text-[10px] text-muted">{item.label}</p>
              <p className="text-xs font-semibold text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Days Accordion */}
      {itinerary.days.map((day) => (
        <div key={day.dayNumber} className="card overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors"
            onClick={() => setOpenDay(openDay === day.dayNumber ? 0 : day.dayNumber)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                {day.dayNumber}
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary text-sm">Day {day.dayNumber} — {day.city}</p>
                <p className="text-xs text-secondary">{day.date} · {day.activities.length} activities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-accent hidden sm:block">{day.totalEstimatedCost.formatted}</span>
              {openDay === day.dayNumber
                ? <ChevronUp size={18} className="text-muted" />
                : <ChevronDown size={18} className="text-muted" />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {openDay === day.dayNumber && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                  {day.activities.map((act, idx) => (
                    <div key={act.id} className="flex gap-3 pt-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                        {idx < day.activities.length - 1 && (
                          <div className="w-0.5 bg-border flex-1 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-primary text-sm">{act.title}</p>
                            <p className="text-[11px] text-muted">{act.startTime} · {act.location.name}</p>
                          </div>
                          <span className="text-xs font-semibold text-green-700 shrink-0 bg-green-50 px-2 py-0.5 rounded-full">
                            {act.estimatedCost.formatted}
                          </span>
                        </div>
                        <p className="text-xs text-secondary mt-1 line-clamp-2">{act.description}</p>
                        {act.localTip != null && (
                          <p className="text-[11px] text-amber-600 mt-1">💡 {act.localTip}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Destination image collage (Unsplash, free) ──────────────────────────────

const COLLAGE = [
  { src: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=75', alt: 'Taj Mahal' },
  { src: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75', alt: 'Bali Rice Terraces' },
  { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75', alt: 'Swiss Alps' },
  { src: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=75', alt: 'Kyoto Temple' },
  { src: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=75', alt: 'Bangkok' },
  { src: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=75', alt: 'Goa Beach' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PlanPage() {
  const [selectedStyles, setSelectedStyles] = useState<ItineraryStyle[]>(['cultural']);
  const [customPreferences, setCustomPreferences] = useState('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const { mutateAsync: generate, isPending, isError, error } = useGenerateItinerary();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PlanFormValues>({
    defaultValues: {
      adults: 2,
      children: 0,
      budgetTotal: 30000,
      pace: 'moderate',
    },
  });

  const startDate = watch('startDate');

  function toggleStyle(style: ItineraryStyle) {
    setSelectedStyles((prev) =>
      prev.includes(style)
        ? prev.length > 1 ? prev.filter((s) => s !== style) : prev
        : [...prev, style],
    );
  }

  async function onSubmit(values: PlanFormValues) {
    const customList = customPreferences
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const body: GenerateItineraryRequestDTO = {
      destination: values.destination,
      startDate: values.startDate,
      endDate: values.endDate,
      travelers: { adults: Number(values.adults), children: Number(values.children), infants: 0 },
      budgetTotal: Number(values.budgetTotal),
      currency: 'INR',
      style: selectedStyles,
      pace: values.pace,
      ...(customList.length > 0 ? { mustInclude: customList } : {}),
      ...(values.origin.trim().length > 0 ? { flightInfo: { origin: values.origin.trim() } } : {}),
    };

    const res = await generate(body);
    if (res.data != null) {
      setItinerary(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Itinerary Result View ─────────────────────────────────────────────────
  if (itinerary != null) {
    return (
      <PageLayout>
        <div className="page-container py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
                <CheckCircle2 size={22} className="text-green-500" />
                Your Itinerary is Ready!
              </h1>
              <p className="text-sm text-secondary mt-1">AI-generated · Tap any day to expand</p>
            </div>
            <button type="button" className="btn-ghost text-sm" onClick={() => setItinerary(null)}>
              ← Plan Another Trip
            </button>
          </div>
          <ItineraryView itinerary={itinerary} />
        </div>
      </PageLayout>
    );
  }

  // ── Planning Form ─────────────────────────────────────────────────────────
  return (
    <PageLayout>
      {/* ── Full-page wrapper with faded background imagery ── */}
      <div className="relative min-h-screen">

        {/* Ghost images — fixed corners, deeply faded, pointer-events-none */}
        <div className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0" aria-hidden>
          {/* Top-left */}
          <img src={COLLAGE[0]!.src} alt=""
            className="absolute -top-10 -left-16 w-80 h-72 object-cover rounded-3xl"
            style={{ opacity: 0.055, filter: 'blur(2px) saturate(1.2)', transform: 'rotate(-8deg)' }} />
          {/* Top-right */}
          <img src={COLLAGE[1]!.src} alt=""
            className="absolute -top-6 -right-14 w-72 h-64 object-cover rounded-3xl"
            style={{ opacity: 0.055, filter: 'blur(2px) saturate(1.2)', transform: 'rotate(7deg)' }} />
          {/* Mid-left */}
          <img src={COLLAGE[2]!.src} alt=""
            className="absolute top-1/2 -left-20 w-64 h-60 object-cover rounded-3xl"
            style={{ opacity: 0.045, filter: 'blur(3px)', transform: 'translateY(-50%) rotate(-5deg)' }} />
          {/* Mid-right */}
          <img src={COLLAGE[3]!.src} alt=""
            className="absolute top-1/2 -right-16 w-64 h-60 object-cover rounded-3xl"
            style={{ opacity: 0.045, filter: 'blur(3px)', transform: 'translateY(-50%) rotate(6deg)' }} />
          {/* Bottom-left */}
          <img src={COLLAGE[4]!.src} alt=""
            className="absolute -bottom-10 -left-10 w-72 h-64 object-cover rounded-3xl"
            style={{ opacity: 0.05, filter: 'blur(2px)', transform: 'rotate(6deg)' }} />
          {/* Bottom-right */}
          <img src={COLLAGE[5]!.src} alt=""
            className="absolute -bottom-8 -right-12 w-72 h-64 object-cover rounded-3xl"
            style={{ opacity: 0.05, filter: 'blur(2px)', transform: 'rotate(-7deg)' }} />

          {/* Soft gradient mesh over everything so page bg stays clean */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,98,42,0.05) 0%, transparent 65%), var(--bg-page)', opacity: 0.95 }} />
        </div>

        {/* ── Actual content — sits above the ghost images ── */}
        <div className="relative z-10 page-container py-10 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Page heading */}
            <div className="text-center pb-1">
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-xs font-semibold uppercase tracking-[0.18em] mb-3"
                style={{ color: 'var(--color-saffron)' }}
              >
                ✦ AI-Powered Trip Planner ✦
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="font-display font-bold tracking-display"
                style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', color: 'var(--text-primary)' }}
              >
                Where will you go next?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                className="text-sm mt-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Fill in the details — AI crafts your perfect itinerary in seconds
              </motion.p>
            </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Destination + Origin */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <MapPin size={15} className="text-accent" /> Where are you going?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-medium">Destination *</label>
                  <input
                    {...register('destination', { required: 'Destination is required' })}
                    placeholder="Bali, Paris, Goa..."
                    className="input mt-1 w-full"
                  />
                  {errors.destination != null && (
                    <p className="text-xs text-red-500 mt-1">{errors.destination.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted font-medium">Flying From (optional)</label>
                  <input
                    {...register('origin')}
                    placeholder="Delhi, Mumbai, BLR..."
                    className="input mt-1 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Calendar size={15} className="text-accent" /> When are you travelling?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-medium">Start Date *</label>
                  <input
                    type="date"
                    {...register('startDate', { required: 'Start date is required' })}
                    className="input mt-1 w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.startDate != null && (
                    <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted font-medium">End Date *</label>
                  <input
                    type="date"
                    {...register('endDate', { required: 'End date is required' })}
                    className="input mt-1 w-full"
                    min={startDate !== '' ? startDate : new Date().toISOString().split('T')[0]}
                  />
                  {errors.endDate != null && (
                    <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Travelers */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Users size={15} className="text-accent" /> Who's travelling?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted font-medium">Adults</label>
                  <input type="number" {...register('adults', { min: 1, max: 9 })} min={1} max={9} className="input mt-1 w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted font-medium">Children</label>
                  <input type="number" {...register('children', { min: 0, max: 9 })} min={0} max={9} className="input mt-1 w-full" />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Wallet size={15} className="text-accent" /> Total budget (₹ per person)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-lg">₹</span>
                <input
                  type="number"
                  {...register('budgetTotal', { required: true, min: 1000 })}
                  step={1000}
                  className="input flex-1"
                  placeholder="30000"
                />
              </div>
              <p className="text-xs text-muted">Includes flights, hotels and activities</p>
            </div>

            {/* Travel Style */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Zap size={15} className="text-accent" /> Travel style
                <span className="text-xs text-muted font-normal">(pick one or more)</span>
              </h2>

              {/* Style chips */}
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleStyle(s.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selectedStyles.includes(s.value)
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-surface text-secondary border-border hover:border-accent hover:text-accent'
                    }`}
                    style={selectedStyles.includes(s.value)
                      ? { background: 'linear-gradient(135deg,#FF7A40,#E8622A)', boxShadow: '0 2px 10px rgba(232,98,42,0.28)' }
                      : {}}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              {/* Custom preferences text box */}
              <div className="pt-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
                  <Pencil size={12} />
                  Your own preferences <span className="font-normal">(optional — comma separated)</span>
                </label>
                <textarea
                  value={customPreferences}
                  onChange={(e) => setCustomPreferences(e.target.value)}
                  placeholder="e.g. rooftop bars, street photography, local markets, hidden temples, cooking class..."
                  rows={2}
                  className="input w-full resize-none"
                  style={{ lineHeight: '1.55' }}
                />
                <p className="text-[11px] text-muted mt-1.5">
                  These will be added as must-include experiences in your itinerary.
                </p>
              </div>
            </div>

            {/* Pace */}
            <div className="card p-5 space-y-3">
              <h2 className="font-semibold text-primary flex items-center gap-2 text-sm">
                <Clock size={15} className="text-accent" /> Travel pace
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {PACES.map((p) => (
                  <label
                    key={p.value}
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                      watch('pace') === p.value
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <input type="radio" {...register('pace')} value={p.value} className="sr-only" />
                    <p className="font-semibold text-sm text-primary">{p.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{p.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {isError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                <AlertCircle size={16} />
                {error instanceof Error ? error.message : 'Failed to generate itinerary. Please try again.'}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating your itinerary…
                </>
              ) : (
                <>
                  <Plane size={18} />
                  Generate AI Itinerary
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {isPending && (
              <p className="text-center text-xs text-muted animate-pulse">
                Our AI is crafting your perfect trip plan — this takes 10–20 seconds ✨
              </p>
            )}

          </form>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
