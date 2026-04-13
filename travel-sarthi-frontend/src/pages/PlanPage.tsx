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

function StyleChips({ selected, onToggle, accent = 'saffron' }: {
  selected: ItineraryStyle[];
  onToggle: (s: ItineraryStyle) => void;
  accent?: 'saffron' | 'teal';
}) {
  const activeColor = accent === 'teal' ? '#0A6B66' : '#E8622A';
  const activeShadow = accent === 'teal'
    ? '0 4px 14px rgba(10,107,102,0.30)'
    : '0 4px 14px rgba(232,98,42,0.30)';
  return (
    <div className="flex flex-wrap gap-2">
      {STYLES.map((s) => {
        const isActive = selected.includes(s.value);
        return (
          <button key={s.value} type="button" onClick={() => onToggle(s.value)}
            className="transition-all duration-200"
            style={{
              padding: '8px 16px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              border: isActive ? 'none' : '1.5px solid var(--border-card)',
              background: isActive ? activeColor : 'var(--bg-page)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              boxShadow: isActive ? activeShadow : 'none',
              transform: isActive ? 'scale(1.03)' : 'scale(1)',
            }}>
            <span style={{ marginRight: 6 }}>{s.emoji}</span>{s.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Shared: Pace selector ────────────────────────────────────────────────────

function PaceSelector({ value, name, register, accent = 'saffron' }: {
  value: PacePreference; name: string; register: any; accent?: 'saffron' | 'teal';
}) {
  const activeColor  = accent === 'teal' ? '#0A6B66' : '#E8622A';
  const activeBg     = accent === 'teal' ? 'rgba(10,107,102,0.06)' : 'rgba(232,98,42,0.06)';
  const activeShadow = accent === 'teal'
    ? '0 8px 24px rgba(10,107,102,0.14)'
    : '0 8px 24px rgba(232,98,42,0.14)';
  return (
    <div className="grid grid-cols-3 gap-3">
      {PACES.map((p) => {
        const isActive = value === p.value;
        return (
          <label key={p.value} className="cursor-pointer">
            <input type="radio" {...register(name)} value={p.value} className="sr-only" />
            <div className="rounded-2xl p-4 text-center border-2 transition-all duration-200 select-none"
              style={{
                borderColor: isActive ? activeColor : 'var(--border-card)',
                background: isActive ? activeBg : 'var(--bg-page)',
                boxShadow: isActive ? activeShadow : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}>
              <div className="text-2xl mb-1.5">{p.icon}</div>
              <p className="font-bold text-sm" style={{ color: isActive ? activeColor : 'var(--text-primary)' }}>{p.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

// ─── Section wrapper — white elevated card with stagger ───────────────────────

function FormSection({ step, icon, title, accent = 'saffron', delay = 0, children }: {
  step: string; icon: React.ReactNode; title: string;
  accent?: 'saffron' | 'teal'; delay?: number; children: React.ReactNode;
}) {
  const color  = accent === 'teal' ? '#0A6B66' : '#E8622A';
  const bgTint = accent === 'teal' ? 'rgba(10,107,102,0.04)' : 'rgba(232,98,42,0.04)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 28px rgba(0,0,0,0.07)',
        border: '1px solid rgba(0,0,0,0.055)',
      }}>
      {/* Card header strip */}
      <div className="flex items-center gap-3 px-6 py-4"
        style={{ background: bgTint, borderBottom: '1px solid rgba(0,0,0,0.05)', borderLeft: `3px solid ${color}` }}>
        <span className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0"
          style={{ background: color, boxShadow: `0 3px 10px ${color}55` }}>
          {step}
        </span>
        <span style={{ color }} className="shrink-0">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--text-muted)' }}>{title}</span>
      </div>
      {/* Content */}
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}

// ─── Premium form input label ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-[0.11em] mb-1.5"
      style={{ color: 'var(--text-muted)' }}>
      {children}
    </label>
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

      {/* ══════════════════════════════════════════════════════════════════
          STEP 0 — Mode selection (with hero banner)
      ══════════════════════════════════════════════════════════════════ */}
      {selectedMode === null && (
        <>
          {/* Hero banner */}
          <div className="relative overflow-hidden" style={{ height: 200 }}>
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=85"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 55%', filter: 'blur(5px)', transform: 'scale(1.08)' }}
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.22) 100%)',
            }} />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 h-full">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-3 text-[10px] font-bold uppercase tracking-[0.13em]"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
                <Sparkles size={10} /> AI-Powered Trip Planner
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.07 }}
                className="font-display font-black text-white"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', letterSpacing: '-0.03em', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.5)' }}>
                Where will you <span style={{ color: '#FFAB76' }}>go next?</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.01em' }}>
                AI crafts every detail of your perfect trip
              </motion.p>
            </div>
          </div>

          {/* Mode cards */}
          <div className="page-container py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>

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
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s ease, transform 0.3s ease' }}>
                  <div className="relative overflow-hidden" style={{ height: 200 }}>
                    <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=700&q=80"
                      alt="Santorini, Greece"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      style={{ objectPosition: 'center 60%' }} />
                    <div className="absolute bottom-0 left-0 right-0" style={{ height: 56, background: 'linear-gradient(to top, var(--bg-card), transparent)' }} />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full text-white"
                        style={{ background: '#E8622A', boxShadow: '0 2px 10px rgba(232,98,42,0.45)' }}>
                        <Plane size={10} /> Mode A
                      </span>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-3">
                    <h3 className="font-display font-bold text-xl leading-snug mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      I Know Where<br/>I'm Going
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Destination set. Let our AI craft your complete day-by-day itinerary with activities, dining &amp; budget.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#E8622A' }}>
                      Plan my trip <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
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
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s ease, transform 0.3s ease' }}>
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
                  <div className="px-6 pb-6 pt-3">
                    <h3 className="font-display font-bold text-xl leading-snug mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Surprise Me —<br/>Find My Destination
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Share your budget, mood &amp; style — our AI discovers the perfect destination that matches you.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#0A6B66' }}>
                      Surprise me <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2A — Mode A form  (NO hero banner)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {selectedMode === 'A' && (
          <motion.div key="form-a"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: 'calc(100vh - 68px)', background: 'linear-gradient(160deg, #FDFAF6 0%, #F5EDE0 100%)' }}>

            {/* ── Slim back-nav strip ── */}
            <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
              <div className="page-container flex items-center justify-between py-3.5">
                <button type="button" onClick={() => setSelectedMode(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                  style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF7A40,#E8622A)', boxShadow: '0 3px 10px rgba(232,98,42,0.35)' }}>
                    <Plane size={12} color="white" />
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Mode A</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>— I Know Where I'm Going</span>
                </div>
                <div style={{ width: 80 }} />
              </div>
            </div>

            {/* ── Decorative background blobs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
              <div style={{ position: 'absolute', top: '8%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,98,42,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
              <div style={{ position: 'absolute', bottom: '15%', left: '-8%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,165,100,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            {/* ── Form body ── */}
            <div className="page-container py-14" style={{ position: 'relative', zIndex: 1 }}>
              <div className="max-w-[600px] mx-auto">

                {/* Page intro — dramatic */}
                <motion.div className="mb-12"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
                    className="text-xs font-black uppercase tracking-[0.18em] mb-3 inline-flex items-center gap-2"
                    style={{ color: '#E8622A' }}>
                    <span style={{ display: 'inline-block', width: 20, height: 2, background: '#E8622A', borderRadius: 2 }} />
                    AI Itinerary Builder
                  </motion.p>
                  <h1 className="font-display font-black mb-3"
                    style={{ fontSize: 'clamp(3rem, 5.5vw, 4.8rem)', letterSpacing: '-0.035em', lineHeight: 1.0, color: 'var(--text-primary)' }}>
                    Let's plan your<br/>
                    <span style={{ background: 'linear-gradient(135deg, #FF7A40 0%, #E8622A 60%, #C94E1A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      perfect trip.
                    </span>
                  </h1>
                  <p className="text-[1.05rem]" style={{ color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 420 }}>
                    Fill in your travel details — our AI crafts every day, hotel &amp; activity.
                  </p>
                </motion.div>

                <form onSubmit={formA.handleSubmit(onSubmitA)} className="space-y-5">

                  <FormSection step="01" icon={<MapPin size={13}/>} title="Where are you going?" delay={0.12}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Destination *</FieldLabel>
                        <input {...formA.register('destination', { required: 'Required' })}
                          placeholder="Bali, Paris, Goa…" className="input w-full" />
                        {formA.formState.errors.destination && (
                          <p className="text-xs text-red-500 mt-1">{formA.formState.errors.destination.message}</p>
                        )}
                      </div>
                      <div>
                        <FieldLabel>Flying From <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></FieldLabel>
                        <input {...formA.register('origin')} placeholder="Delhi, Mumbai, BLR…" className="input w-full" />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection step="02" icon={<Calendar size={13}/>} title="When are you travelling?" delay={0.20}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Start Date *</FieldLabel>
                        <input type="date" {...formA.register('startDate', { required: 'Required' })}
                          className="input w-full" min={new Date().toISOString().split('T')[0]} />
                        {formA.formState.errors.startDate && (
                          <p className="text-xs text-red-500 mt-1">{formA.formState.errors.startDate.message}</p>
                        )}
                      </div>
                      <div>
                        <FieldLabel>End Date *</FieldLabel>
                        <input type="date" {...formA.register('endDate', { required: 'Required' })}
                          className="input w-full" min={formA.watch('startDate') || new Date().toISOString().split('T')[0]} />
                        {formA.formState.errors.endDate && (
                          <p className="text-xs text-red-500 mt-1">{formA.formState.errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                  </FormSection>

                  <FormSection step="03" icon={<Users size={13}/>} title="Who's travelling?" delay={0.28}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Adults</FieldLabel>
                        <input type="number" {...formA.register('adults', { min: 1, max: 9 })} min={1} max={9} className="input w-full" />
                      </div>
                      <div>
                        <FieldLabel>Children</FieldLabel>
                        <input type="number" {...formA.register('children', { min: 0, max: 9 })} min={0} max={9} className="input w-full" />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection step="04" icon={<Wallet size={13}/>} title="Total budget (₹ per person)" delay={0.36}>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: 'var(--text-muted)' }}>₹</span>
                      <input type="number" {...formA.register('budgetTotal', { required: true, min: 1000 })}
                        step={1000} className="input w-full" placeholder="30,000" style={{ paddingLeft: '2rem' }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Includes flights, hotels and activities</p>
                  </FormSection>

                  <FormSection step="05" icon={<Zap size={13}/>} title="Travel style" delay={0.44}>
                    <StyleChips selected={stylesA} onToggle={toggleA} accent="saffron" />
                    <div className="mt-4">
                      <FieldLabel><Pencil size={10} style={{ display: 'inline', marginRight: 4 }} />Your own preferences <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, comma separated)</span></FieldLabel>
                      <textarea value={customPrefsA} onChange={(e) => setCustomPrefsA(e.target.value)}
                        placeholder="e.g. rooftop bars, street photography, hidden temples, cooking class…"
                        rows={2} className="input w-full resize-none" style={{ lineHeight: '1.6' }} />
                    </div>
                  </FormSection>

                  <FormSection step="06" icon={<Clock size={13}/>} title="Travel pace" delay={0.52}>
                    <PaceSelector value={formA.watch('pace')} name="pace" register={formA.register} accent="saffron" />
                  </FormSection>

                  {isError && (
                    <div className="flex items-center gap-2.5 text-red-600 rounded-2xl p-4 text-sm"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
                      <AlertCircle size={16} className="shrink-0"/> {error instanceof Error ? error.message : 'Failed to generate itinerary.'}
                    </div>
                  )}

                  <div className="pt-2">
                    <motion.button type="submit" disabled={isPending}
                      whileHover={!isPending ? { scale: 1.015, boxShadow: '0 16px 48px rgba(232,98,42,0.42)' } : {}}
                      whileTap={!isPending ? { scale: 0.985 } : {}}
                      className="w-full flex items-center justify-center gap-2.5 py-4 text-base font-bold rounded-2xl text-white"
                      style={{ background: isPending ? '#ccc' : 'linear-gradient(135deg, #FF7A40 0%, #E8622A 100%)', letterSpacing: '-0.01em', boxShadow: isPending ? 'none' : '0 8px 28px rgba(232,98,42,0.30)' }}>
                      {isPending ? (
                        <><Loader2 size={18} className="animate-spin"/> Crafting your itinerary…</>
                      ) : (
                        <><Sparkles size={18}/> Generate AI Itinerary <ArrowRight size={18}/></>
                      )}
                    </motion.button>
                    {isPending && (
                      <p className="text-center text-xs mt-3 animate-pulse" style={{ color: 'var(--text-muted)' }}>
                        Our AI is designing your perfect trip — this takes 10–20 seconds ✨
                      </p>
                    )}
                  </div>

                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2B — Mode B form  (NO hero banner)
        ══════════════════════════════════════════════════════════════════ */}
        {selectedMode === 'B' && (
          <motion.div key="form-b"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{ minHeight: 'calc(100vh - 68px)', background: 'linear-gradient(160deg, #F6FDFB 0%, #E0F5F0 100%)' }}>

            {/* ── Slim back-nav strip ── */}
            <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 30 }}>
              <div className="page-container flex items-center justify-between py-3.5">
                <button type="button" onClick={() => setSelectedMode(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
                  style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#12A899,#0A6B66)', boxShadow: '0 3px 10px rgba(10,107,102,0.35)' }}>
                    <Compass size={12} color="white" />
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Mode B</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>— Surprise Me</span>
                </div>
                <div style={{ width: 80 }} />
              </div>
            </div>

            {/* ── Decorative background blobs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
              <div style={{ position: 'absolute', top: '10%', right: '-12%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(10,107,102,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
              <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(18,168,153,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            {/* ── Form body ── */}
            <div className="page-container py-14" style={{ position: 'relative', zIndex: 1 }}>
              <div className="max-w-[600px] mx-auto">

                {/* Page intro — dramatic */}
                <motion.div className="mb-12"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
                    className="text-xs font-black uppercase tracking-[0.18em] mb-3 inline-flex items-center gap-2"
                    style={{ color: '#0A6B66' }}>
                    <span style={{ display: 'inline-block', width: 20, height: 2, background: '#0A6B66', borderRadius: 2 }} />
                    AI Destination Finder
                  </motion.p>
                  <h1 className="font-display font-black mb-3"
                    style={{ fontSize: 'clamp(3rem, 5.5vw, 4.8rem)', letterSpacing: '-0.035em', lineHeight: 1.0, color: 'var(--text-primary)' }}>
                    Tell us your<br/>
                    <span style={{ background: 'linear-gradient(135deg, #12A899 0%, #0A6B66 60%, #064E49 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      vibe.
                    </span>
                  </h1>
                  <p className="text-[1.05rem]" style={{ color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 420 }}>
                    Share your budget and mood — our AI finds the perfect destination for you.
                  </p>
                </motion.div>

                <form onSubmit={formB.handleSubmit(onSubmitB)} className="space-y-5">

                  <FormSection step="01" icon={<MapPin size={13}/>} title="Where are you flying from?" accent="teal" delay={0.12}>
                    <FieldLabel>Departure city *</FieldLabel>
                    <input {...formB.register('origin', { required: 'Please enter your departure city' })}
                      placeholder="Delhi, Mumbai, Bangalore…" className="input w-full" />
                    {formB.formState.errors.origin && (
                      <p className="text-xs text-red-500 mt-1">{formB.formState.errors.origin.message}</p>
                    )}
                  </FormSection>

                  <FormSection step="02" icon={<Wallet size={13}/>} title="Budget & Duration" accent="teal" delay={0.20}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Total budget (₹)</FieldLabel>
                        <div className="relative">
                          <IndianRupee size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                          <input type="number" {...formB.register('budget', { min: 5000 })} step={1000} className="input w-full" placeholder="30,000" style={{ paddingLeft: '2rem' }} />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Duration (days)</FieldLabel>
                        <input type="number" {...formB.register('durationDays', { min: 1, max: 30 })} min={1} max={30} className="input w-full" />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection step="03" icon={<Zap size={13}/>} title="Travel style" accent="teal" delay={0.28}>
                    <StyleChips selected={stylesB} onToggle={toggleB} accent="teal" />
                    <div className="mt-4">
                      <FieldLabel><Pencil size={10} style={{ display: 'inline', marginRight: 4 }} />Your own preferences <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></FieldLabel>
                      <textarea value={customPrefsB} onChange={(e) => setCustomPrefsB(e.target.value)}
                        placeholder="e.g. beach sunsets, trekking, street food, temples…"
                        rows={2} className="input w-full resize-none" style={{ lineHeight: '1.6' }} />
                    </div>
                  </FormSection>

                  <FormSection step="04" icon={<Clock size={13}/>} title="Travel pace" accent="teal" delay={0.36}>
                    <PaceSelector value={formB.watch('pace')} name="pace" register={formB.register} accent="teal" />
                  </FormSection>

                  <div className="pt-2">
                    <motion.button type="submit"
                      whileHover={{ scale: 1.015, boxShadow: '0 16px 48px rgba(10,107,102,0.36)' }}
                      whileTap={{ scale: 0.985 }}
                      className="w-full flex items-center justify-center gap-2.5 py-4 text-base font-bold rounded-2xl text-white"
                      style={{ background: 'linear-gradient(135deg, #12A899 0%, #0A6B66 100%)', letterSpacing: '-0.01em', boxShadow: '0 8px 28px rgba(10,107,102,0.28)' }}>
                      <Compass size={18}/> Discover My Destination <ArrowRight size={18}/>
                    </motion.button>
                  </div>

                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
}
