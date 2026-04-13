import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Users, Wallet, Zap, ChevronDown, ChevronUp,
  Clock, Plane, Loader2, AlertCircle, CheckCircle2, ArrowRight,
  Pencil, Compass, ArrowLeft, IndianRupee, Sparkles,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useGenerateItinerary } from '@/hooks/useItinerary';
import type {
  GenerateItineraryRequestDTO,
  Itinerary,
  ItineraryStyle,
  PacePreference,
} from 'travel-sarthi-shared-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLES: { value: ItineraryStyle; label: string; emoji: string }[] = [
  { value: 'adventure',   label: 'Adventure',  emoji: '🧗' },
  { value: 'cultural',    label: 'Cultural',   emoji: '🏛️' },
  { value: 'relaxation',  label: 'Relaxation', emoji: '🧘' },
  { value: 'foodie',      label: 'Foodie',     emoji: '🍜' },
  { value: 'romantic',    label: 'Romantic',   emoji: '💑' },
  { value: 'family',      label: 'Family',     emoji: '👨‍👩‍👧' },
  { value: 'budget',      label: 'Budget',     emoji: '💸' },
];

const PACES: { value: PacePreference; label: string; desc: string; icon: string }[] = [
  { value: 'slow',     label: 'Slow',     desc: '2–3 activities/day', icon: '🌿' },
  { value: 'moderate', label: 'Moderate', desc: '4–5 activities/day', icon: '⚡' },
  { value: 'packed',   label: 'Packed',   desc: '6+ activities/day',  icon: '🔥' },
];

// ─── Itinerary result ─────────────────────────────────────────────────────────

function ItineraryView({ itinerary, onReset }: { itinerary: Itinerary; onReset: () => void }) {
  const [openDay, setOpenDay] = useState<number>(1);
  const budget = itinerary.budgetBreakdown;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
            <CheckCircle2 size={22} className="text-green-500" /> Your Itinerary is Ready!
          </h1>
          <p className="text-sm text-secondary mt-1">AI-generated · Tap any day to expand</p>
        </div>
        <button type="button" className="btn-ghost text-sm" onClick={onReset}>← Plan Another Trip</button>
      </div>
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary">{itinerary.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-secondary">
              <span className="flex items-center gap-1"><MapPin size={14}/>{itinerary.destination}</span>
              <span className="flex items-center gap-1"><Calendar size={14}/>{itinerary.startDate} → {itinerary.endDate}</span>
              <span className="flex items-center gap-1"><Clock size={14}/>{itinerary.durationDays} days</span>
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
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Flights', value: budget.flights.formatted },
            { label: 'Hotels', value: budget.accommodation.formatted },
            { label: 'Food', value: budget.food.formatted },
            { label: 'Activities', value: budget.activities.formatted },
            { label: 'Transport', value: budget.transport.formatted },
            { label: 'Misc', value: budget.miscellaneous.formatted },
          ].map((item) => (
            <div key={item.label} className="bg-surface rounded-xl p-2 text-center">
              <p className="text-[10px] text-muted">{item.label}</p>
              <p className="text-xs font-semibold text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
      {itinerary.days.map((day) => (
        <div key={day.dayNumber} className="card overflow-hidden">
          <button type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-surface transition-colors"
            onClick={() => setOpenDay(openDay === day.dayNumber ? 0 : day.dayNumber)}>
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
              {openDay === day.dayNumber ? <ChevronUp size={18} className="text-muted"/> : <ChevronDown size={18} className="text-muted"/>}
            </div>
          </button>
          <AnimatePresence initial={false}>
            {openDay === day.dayNumber && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="px-4 pb-4 space-y-3 border-t border-border">
                  {day.activities.map((act, idx) => (
                    <div key={act.id} className="flex gap-3 pt-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0"/>
                        {idx < day.activities.length - 1 && <div className="w-0.5 bg-border flex-1 mt-1"/>}
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
                        {act.localTip != null && <p className="text-[11px] text-amber-600 mt-1">💡 {act.localTip}</p>}
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

// ─── Form types ───────────────────────────────────────────────────────────────

interface ModeAValues {
  destination: string; origin: string; startDate: string;
  endDate: string; adults: number; children: number;
  budgetTotal: number; pace: PacePreference;
}
interface ModeBValues {
  origin: string; budget: number; durationDays: number; pace: PacePreference;
}

// ─── Shared: Style chips ──────────────────────────────────────────────────────

function StyleChips({ selected, onToggle }: { selected: ItineraryStyle[]; onToggle: (s: ItineraryStyle) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STYLES.map((s) => (
        <button key={s.value} type="button" onClick={() => onToggle(s.value)}
          className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200"
          style={selected.includes(s.value)
            ? { background: 'linear-gradient(135deg,#FF7A40,#E8622A)', color: '#fff', border: 'transparent', boxShadow: '0 2px 10px rgba(232,98,42,0.28)' }
            : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border-card)' }}>
          {s.emoji} {s.label}
        </button>
      ))}
    </div>
  );
}

// ─── Shared: Pace selector ────────────────────────────────────────────────────

function PaceSelector({ value, name, register }: { value: PacePreference; name: string; register: any }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PACES.map((p) => (
        <label key={p.value}
          className="cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-200"
          style={{
            borderColor: value === p.value ? 'var(--color-saffron)' : 'var(--border-card)',
            background: value === p.value ? 'rgba(232,98,42,0.05)' : 'var(--bg-card)',
          }}>
          <input type="radio" {...register(name)} value={p.value} className="sr-only" />
          <div className="text-xl mb-1">{p.icon}</div>
          <p className="font-semibold text-sm text-primary">{p.label}</p>
          <p className="text-[11px] text-muted mt-0.5">{p.desc}</p>
        </label>
      ))}
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function FormSection({ icon, title, accent = 'saffron', children }: {
  icon: React.ReactNode; title: string; accent?: 'saffron' | 'teal'; children: React.ReactNode;
}) {
  const color = accent === 'teal' ? '#0A6B66' : 'var(--color-saffron)';
  const bg    = accent === 'teal' ? 'rgba(10,107,102,0.08)' : 'rgba(232,98,42,0.08)';
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-surface)' }}>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg, color }}>
          {icon}
        </span>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PlanPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'A' | 'B' | null>(null);
  const [itinerary, setItinerary]       = useState<Itinerary | null>(null);

  // Mode A
  const [stylesA, setStylesA]         = useState<ItineraryStyle[]>(['cultural']);
  const [customPrefsA, setCustomPrefsA] = useState('');
  const { mutateAsync: generate, isPending, isError, error } = useGenerateItinerary();
  const formA = useForm<ModeAValues>({ defaultValues: { adults: 2, children: 0, budgetTotal: 30000, pace: 'moderate' } });

  // Mode B
  const [stylesB, setStylesB]         = useState<ItineraryStyle[]>(['adventure']);
  const [customPrefsB, setCustomPrefsB] = useState('');
  const formB = useForm<ModeBValues>({ defaultValues: { budget: 30000, durationDays: 5, pace: 'moderate' } });

  const toggleA = (s: ItineraryStyle) =>
    setStylesA((p) => p.includes(s) ? (p.length > 1 ? p.filter((x) => x !== s) : p) : [...p, s]);
  const toggleB = (s: ItineraryStyle) =>
    setStylesB((p) => p.includes(s) ? (p.length > 1 ? p.filter((x) => x !== s) : p) : [...p, s]);

  async function onSubmitA(v: ModeAValues) {
    const mustInclude = customPrefsA.split(',').map((s) => s.trim()).filter(Boolean);
    const body: GenerateItineraryRequestDTO = {
      destination: v.destination, startDate: v.startDate, endDate: v.endDate,
      travelers: { adults: Number(v.adults), children: Number(v.children), infants: 0 },
      budgetTotal: Number(v.budgetTotal), currency: 'INR',
      style: stylesA, pace: v.pace,
      ...(mustInclude.length > 0 ? { mustInclude } : {}),
      ...(v.origin.trim() ? { flightInfo: { origin: v.origin.trim() } } : {}),
    };
    const res = await generate(body);
    if (res.data != null) { setItinerary(res.data); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  function onSubmitB(v: ModeBValues) {
    const params = new URLSearchParams({
      origin: v.origin, budget: String(v.budget),
      durationDays: String(v.durationDays), travelMood: stylesB[0] ?? 'adventure',
    });
    navigate(`/discover?${params.toString()}`);
  }

  // Itinerary result
  if (itinerary != null) {
    return (
      <PageLayout>
        <div className="page-container py-8">
          <ItineraryView itinerary={itinerary} onReset={() => { setItinerary(null); setSelectedMode(null); }} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {/* Single clean hero image */}
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 55%' }}
        />
        {/* Ultra-light overlay — 5-6% tint, text readable via shadow */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.22) 100%)',
        }} />

        {/* Hero text — compact, centered */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 h-full">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-3 text-[10px] font-bold uppercase tracking-[0.13em]"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
            <Sparkles size={10} /> AI-Powered Trip Planner
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.07 }}
            className="font-display font-black text-white"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.5)' }}>
            {selectedMode === null ? (
              <>Where will you <span style={{ color: '#FFAB76' }}>go next?</span></>
            ) : selectedMode === 'A' ? (
              <>Build your <span style={{ color: '#FFAB76' }}>itinerary</span></>
            ) : (
              <>Find your <span style={{ color: '#7EDDD8' }}>destination</span></>
            )}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.01em' }}>
            {selectedMode === null
              ? 'AI crafts every detail of your perfect trip'
              : selectedMode === 'A'
              ? 'Your destination is set — we\'ll plan every day.'
              : 'Tell us your vibe — we\'ll find your ideal destination.'}
          </motion.p>
        </div>
      </div>

      <div className="page-container py-10">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Mode selection ──────────────────────────────────────── */}
          {selectedMode === null && (
            <motion.div key="mode-select"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>

              {/* Section label */}
              <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] mb-6" style={{ color: 'var(--text-muted)' }}>
                Choose how you want to plan
              </p>

              <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">

                {/* Mode A */}
                <motion.button type="button"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: [0.16,1,0.3,1] }}
                  whileHover={{ y: -5, boxShadow: '0 20px 56px rgba(232,98,42,0.16)' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedMode('A')}
                  className="text-left rounded-2xl overflow-hidden cursor-pointer group"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                  }}>

                  {/* Photo panel */}
                  <div className="relative overflow-hidden" style={{ height: 200 }}>
                    <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=700&q=80"
                      alt="Santorini, Greece"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      style={{ objectPosition: 'center 60%' }} />
                    {/* subtle bottom fade into card */}
                    <div className="absolute bottom-0 left-0 right-0" style={{ height: 56, background: 'linear-gradient(to top, var(--bg-card), transparent)' }} />
                    {/* Mode badge over image */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full text-white"
                        style={{ background: '#E8622A', boxShadow: '0 2px 10px rgba(232,98,42,0.45)' }}>
                        <Plane size={10} /> Mode A
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 pb-6 pt-3">
                    <h3 className="font-display font-bold text-xl leading-snug mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      I Know Where<br/>I'm Going
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Destination set. Let our AI craft your complete day-by-day itinerary with activities, dining &amp; budget.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#E8622A' }}>
                      Plan my trip
                      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>

                {/* Mode B */}
                <motion.button type="button"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.45, ease: [0.16,1,0.3,1] }}
                  whileHover={{ y: -5, boxShadow: '0 20px 56px rgba(10,107,102,0.14)' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedMode('B')}
                  className="text-left rounded-2xl overflow-hidden cursor-pointer group"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                  }}>

                  {/* Photo panel */}
                  <div className="relative overflow-hidden" style={{ height: 200 }}>
                    <img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=700&q=80"
                      alt="Maldives"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                    <div className="absolute bottom-0 left-0 right-0" style={{ height: 56, background: 'linear-gradient(to top, var(--bg-card), transparent)' }} />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full text-white"
                        style={{ background: '#0A6B66', boxShadow: '0 2px 10px rgba(10,107,102,0.45)' }}>
                        <Compass size={10} /> Mode B
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-6 pb-6 pt-3">
                    <h3 className="font-display font-bold text-xl leading-snug mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Surprise Me —<br/>Find My Destination
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Share your budget, mood &amp; style — our AI discovers the perfect destination that matches you.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#0A6B66' }}>
                      Surprise me
                      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>
              </div>

            </motion.div>
          )}

          {/* ── Step 2A: Mode A form ─────────────────────────────────────────── */}
          {selectedMode === 'A' && (
            <motion.div key="form-a"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto">

              {/* Back + header */}
              <div className="flex items-center gap-3 mb-8">
                <button type="button" onClick={() => setSelectedMode(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-saffron)' }}>
                    <Plane size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-saffron)' }}>Mode A</p>
                    <p className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>I Know Where I'm Going</p>
                  </div>
                </div>
              </div>

              <form onSubmit={formA.handleSubmit(onSubmitA)} className="space-y-4">

                <FormSection icon={<MapPin size={14}/>} title="Where are you going?">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-medium">Destination *</label>
                      <input {...formA.register('destination', { required: 'Required' })}
                        placeholder="Bali, Paris, Goa..." className="input mt-1 w-full" />
                      {formA.formState.errors.destination && <p className="text-xs text-red-500 mt-1">{formA.formState.errors.destination.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted font-medium">Flying From (optional)</label>
                      <input {...formA.register('origin')} placeholder="Delhi, Mumbai, BLR..." className="input mt-1 w-full" />
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={<Calendar size={14}/>} title="When are you travelling?">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-medium">Start Date *</label>
                      <input type="date" {...formA.register('startDate', { required: 'Required' })}
                        className="input mt-1 w-full" min={new Date().toISOString().split('T')[0]} />
                      {formA.formState.errors.startDate && <p className="text-xs text-red-500 mt-1">{formA.formState.errors.startDate.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted font-medium">End Date *</label>
                      <input type="date" {...formA.register('endDate', { required: 'Required' })}
                        className="input mt-1 w-full" min={formA.watch('startDate') || new Date().toISOString().split('T')[0]} />
                      {formA.formState.errors.endDate && <p className="text-xs text-red-500 mt-1">{formA.formState.errors.endDate.message}</p>}
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={<Users size={14}/>} title="Who's travelling?">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-medium">Adults</label>
                      <input type="number" {...formA.register('adults', { min: 1, max: 9 })} min={1} max={9} className="input mt-1 w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-medium">Children</label>
                      <input type="number" {...formA.register('children', { min: 0, max: 9 })} min={0} max={9} className="input mt-1 w-full" />
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={<Wallet size={14}/>} title="Total budget (₹ per person)">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-lg">₹</span>
                    <input type="number" {...formA.register('budgetTotal', { required: true, min: 1000 })}
                      step={1000} className="input flex-1" placeholder="30000" />
                  </div>
                  <p className="text-xs text-muted mt-2">Includes flights, hotels and activities</p>
                </FormSection>

                <FormSection icon={<Zap size={14}/>} title="Travel style (pick one or more)">
                  <StyleChips selected={stylesA} onToggle={toggleA} />
                  <div className="pt-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
                      <Pencil size={11}/> Your own preferences <span className="font-normal">(optional — comma separated)</span>
                    </label>
                    <textarea value={customPrefsA} onChange={(e) => setCustomPrefsA(e.target.value)}
                      placeholder="e.g. rooftop bars, street photography, hidden temples, cooking class..."
                      rows={2} className="input w-full resize-none" style={{ lineHeight: '1.55' }} />
                  </div>
                </FormSection>

                <FormSection icon={<Clock size={14}/>} title="Travel pace">
                  <PaceSelector value={formA.watch('pace')} name="pace" register={formA.register} />
                </FormSection>

                {isError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
                    <AlertCircle size={16}/> {error instanceof Error ? error.message : 'Failed to generate itinerary.'}
                  </div>
                )}

                <motion.button type="submit" disabled={isPending}
                  whileHover={!isPending ? { scale: 1.01, boxShadow: '0 12px 40px rgba(232,98,42,0.38)' } : {}}
                  whileTap={!isPending ? { scale: 0.99 } : {}}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold rounded-2xl">
                  {isPending ? (
                    <><Loader2 size={18} className="animate-spin"/> Crafting your itinerary…</>
                  ) : (
                    <><Sparkles size={18}/> Generate AI Itinerary <ArrowRight size={18}/></>
                  )}
                </motion.button>
                {isPending && (
                  <p className="text-center text-xs text-muted animate-pulse">
                    Our AI is designing your perfect trip — this takes 10–20 seconds ✨
                  </p>
                )}
              </form>
            </motion.div>
          )}

          {/* ── Step 2B: Mode B form ─────────────────────────────────────────── */}
          {selectedMode === 'B' && (
            <motion.div key="form-b"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto">

              <div className="flex items-center gap-3 mb-8">
                <button type="button" onClick={() => setSelectedMode(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0A6B66' }}>
                    <Compass size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0A6B66' }}>Mode B</p>
                    <p className="font-display font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>Surprise Me</p>
                  </div>
                </div>
              </div>

              <form onSubmit={formB.handleSubmit(onSubmitB)} className="space-y-4">

                <FormSection icon={<MapPin size={14}/>} title="Where are you flying from?" accent="teal">
                  <div>
                    <label className="text-xs text-muted font-medium">Departure city *</label>
                    <input {...formB.register('origin', { required: 'Please enter your departure city' })}
                      placeholder="Delhi, Mumbai, Bangalore..." className="input mt-1 w-full" />
                    {formB.formState.errors.origin && <p className="text-xs text-red-500 mt-1">{formB.formState.errors.origin.message}</p>}
                  </div>
                </FormSection>

                <FormSection icon={<Wallet size={14}/>} title="Budget & Duration" accent="teal">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-medium">Total budget (₹)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <IndianRupee size={13} className="text-muted shrink-0"/>
                        <input type="number" {...formB.register('budget', { min: 5000 })} step={1000} className="input flex-1" placeholder="30000"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted font-medium">Duration (days)</label>
                      <input type="number" {...formB.register('durationDays', { min: 1, max: 30 })} min={1} max={30} className="input mt-1 w-full"/>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={<Zap size={14}/>} title="Travel style (pick one or more)" accent="teal">
                  <StyleChips selected={stylesB} onToggle={toggleB} />
                  <div className="pt-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-2">
                      <Pencil size={11}/> Your own preferences <span className="font-normal">(optional)</span>
                    </label>
                    <textarea value={customPrefsB} onChange={(e) => setCustomPrefsB(e.target.value)}
                      placeholder="e.g. beach sunsets, trekking, street food, temples..."
                      rows={2} className="input w-full resize-none" style={{ lineHeight: '1.55' }} />
                  </div>
                </FormSection>

                <FormSection icon={<Clock size={14}/>} title="Travel pace" accent="teal">
                  <PaceSelector value={formB.watch('pace')} name="pace" register={formB.register} />
                </FormSection>

                <motion.button type="submit"
                  whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(10,107,102,0.35)' }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold rounded-2xl text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #0D8A84, #0A6B66)' }}>
                  <Compass size={18}/> Discover My Destination <ArrowRight size={18}/>
                </motion.button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
