import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowLeft, Bed, Calendar, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Coffee,
  Compass, Download, Landmark, Lightbulb, MapPin, Mountain, Navigation, Plane, Route,
  Share2, ShoppingBag, Sparkles, Sun, Utensils, Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import type { ItineraryDay, ItinerarySlot } from 'travel-sarthi-shared-types';
import { PageLayout } from '@/components/layout/PageLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useItinerary } from '@/hooks/useItinerary';
import { discoveryService } from '@/services/discovery.service';

const DISCOVER_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=85',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1600&q=85',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=85',
];

const BUDGET_COLORS = ['#E8622A', '#0A6B66', '#C9974A', '#6E5A42', '#1B6CA8', '#C65A3A', '#7D7A92'];

function usePersistentChecklist(storageKey: string) {
  const [state, setState] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw != null ? JSON.parse(raw) as Record<string, boolean> : {};
    } catch {
      return {};
    }
  });

  const toggle = (key: string) => {
    setState((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { state, toggle };
}

function cleanImage(src?: string | null) {
  const value = src?.trim();
  return value != null && value.length > 0 ? value : null;
}

function formatInr(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

type SlotVisual = { Icon: typeof Compass; tint: string; glow: string; label: string };

function slotVisual(slot: ItinerarySlot): SlotVisual {
  const haystack = `${slot.type} ${slot.activity}`.toLowerCase();
  const pick = (Icon: typeof Compass, tint: string, label: string): SlotVisual => ({
    Icon, tint, glow: `${tint}22`, label,
  });
  if (/(breakfast|coffee|cafe|brunch)/.test(haystack)) return pick(Coffee, '#C9974A', 'Cafe');
  if (/(lunch|dinner|meal|food|eat|restaurant|cuisine|dining)/.test(haystack)) return pick(Utensils, '#E8622A', 'Dining');
  if (/(flight|airport|fly|plane)/.test(haystack)) return pick(Plane, '#1B6CA8', 'Transit');
  if (/(transfer|transport|drive|cab|taxi|train|bus|metro|commute)/.test(haystack)) return pick(Navigation, '#1B6CA8', 'Transport');
  if (/(hotel|check-?in|check-?out|rest|hostel|stay|sleep)/.test(haystack)) return pick(Bed, '#6E5A42', 'Stay');
  if (/(shop|market|bazaar|mall|souvenir)/.test(haystack)) return pick(ShoppingBag, '#C65A3A', 'Shopping');
  if (/(temple|museum|palace|fort|church|monument|heritage|gallery|landmark)/.test(haystack)) return pick(Landmark, '#7D5BA6', 'Culture');
  if (/(hike|trek|mountain|trail|peak|nature|park|safari|adventure)/.test(haystack)) return pick(Mountain, '#0A6B66', 'Nature');
  if (/(photo|viewpoint|sunset|sunrise|scenic|lookout)/.test(haystack)) return pick(Camera, '#D4548A', 'Scenic');
  return pick(Compass, '#0A6B66', 'Explore');
}

const dayCardVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 90 : -90, scale: 0.96, rotateY: dir > 0 ? 4 : -4 }),
  center: { opacity: 1, x: 0, scale: 1, rotateY: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -90 : 90, scale: 0.96, rotateY: dir > 0 ? -4 : 4 }),
};

function ItineraryDayDeck({ days, fallbackImages }: { days: ItineraryDay[]; fallbackImages: string[] }) {
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const safeIndex = Math.min(index, days.length - 1);
  const day = days[safeIndex];

  const paginate = useCallback((dir: number) => {
    setPage(([current]) => {
      const next = Math.min(Math.max(current + dir, 0), days.length - 1);
      return [next, next === current ? 0 : dir];
    });
  }, [days.length]);

  const goTo = useCallback((target: number) => {
    setPage(([current]) => [target, target === current ? 0 : target > current ? 1 : -1]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paginate]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const power = info.offset.x + info.velocity.x * 0.25;
    if (power < -80) paginate(1);
    else if (power > 80) paginate(-1);
  };

  if (day == null) return null;

  const dayImage = cleanImage(day.heroImage?.url) ?? fallbackImages[day.dayNumber % Math.max(fallbackImages.length, 1)];
  const dayTotal = day.dayBudgetSummary != null ? formatInr(day.dayBudgetSummary.dayTotalInr) : day.totalEstimatedCost.formatted;
  const slots = day.slots ?? [];

  return (
    <section className="space-y-6">
      {/* Day rail */}
      <div className="relative -mx-1 overflow-x-auto px-1 pb-2 scrollbar-hide">
        <div className="flex gap-2.5">
          {days.map((d, i) => {
            const active = i === safeIndex;
            return (
              <button
                key={d.dayNumber}
                onClick={() => goTo(i)}
                className="relative shrink-0 rounded-2xl px-4 py-2.5 text-left transition-colors"
                style={{ color: active ? '#fff' : '#1A1208' }}
              >
                {active && (
                  <motion.span
                    layoutId="day-rail-active"
                    className="absolute inset-0 rounded-2xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#FF7A40,#E8622A)', boxShadow: '0 10px 26px rgba(232,98,42,0.4)' }}
                    transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                  />
                )}
                <span className="relative z-10 block text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">Day {d.dayNumber}</span>
                <span className="relative z-10 block text-sm font-semibold">{d.date?.slice(5) ?? d.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress + arrows */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => paginate(-1)}
            disabled={safeIndex === 0}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:bg-[#FFF3EC] disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => paginate(1)}
            disabled={safeIndex === days.length - 1}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:bg-[#FFF3EC] disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex flex-1 items-center gap-1.5">
          {days.map((d, i) => (
            <button
              key={d.dayNumber}
              onClick={() => goTo(i)}
              className="group h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE2D7]"
              aria-label={`Go to day ${d.dayNumber}`}
            >
              <motion.span
                className="block h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#FF7A40,#E8622A)' }}
                initial={false}
                animate={{ width: i <= safeIndex ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </button>
          ))}
        </div>
        <span className="shrink-0 text-sm font-semibold text-muted">{safeIndex + 1} / {days.length}</span>
      </div>

      {/* Animated day card */}
      <div className="relative" style={{ perspective: 1600 }}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.article
            key={day.dayNumber}
            custom={direction}
            variants={dayCardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={onDragEnd}
            className="card overflow-hidden border-none shadow-[0_30px_80px_-30px_rgba(26,18,8,0.45)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Hero band */}
            <div className="relative h-[260px] overflow-hidden bg-[#191410] md:h-[300px]">
              <motion.img
                key={dayImage}
                src={dayImage}
                alt={day.city}
                className="h-full w-full object-cover"
                initial={{ scale: 1.16 }}
                animate={{ scale: 1 }}
                transition={{ duration: 9, ease: 'easeOut' }}
                style={{ filter: 'brightness(0.82) saturate(1.08)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(232,98,42,0.22),transparent_55%)]" />

              <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-md">{dayTotal}</span>
                {day.weatherExpected != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                    <Sun size={13} /> {day.weatherExpected}
                  </span>
                )}
              </div>

              <div className="absolute bottom-5 left-5 right-5 text-white">
                <motion.p
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E8622A] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] shadow-lg"
                >
                  Day {day.dayNumber}
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className="mt-2 font-display text-4xl font-bold leading-tight drop-shadow-xl md:text-5xl"
                >
                  {day.dayLabel ?? day.city}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85"
                >
                  {day.theme != null && <span className="inline-flex items-center gap-1.5"><Sparkles size={13} />{day.theme}</span>}
                  {day.neighborhoodFocus != null && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{day.neighborhoodFocus}</span>}
                </motion.p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gradient-to-b from-[#FFFDFA] to-white p-6 md:p-8">
              {slots.length === 0 ? (
                <p className="py-8 text-center text-secondary">No detailed slots for this day.</p>
              ) : (
                <ol className="relative">
                  {/* vertical spine */}
                  <span className="absolute bottom-4 left-[22px] top-4 w-px bg-gradient-to-b from-[#E8622A]/50 via-[#E8622A]/25 to-transparent md:left-[26px]" aria-hidden />
                  {slots.map((slot, i) => {
                    const v = slotVisual(slot);
                    return (
                      <motion.li
                        key={slot.slotId}
                        initial={{ opacity: 0, x: 26 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.28 + i * 0.07, type: 'spring', stiffness: 260, damping: 26 }}
                        className="relative flex gap-4 pb-7 last:pb-0 md:gap-5"
                      >
                        {/* node */}
                        <div className="relative z-10 shrink-0">
                          <div
                            className="grid h-11 w-11 place-items-center rounded-2xl shadow-md ring-4 ring-white md:h-[54px] md:w-[54px]"
                            style={{ background: `linear-gradient(135deg, ${v.tint}, ${v.tint}cc)`, boxShadow: `0 8px 22px ${v.tint}44` }}
                          >
                            <v.Icon size={20} className="text-white" />
                          </div>
                        </div>

                        {/* content */}
                        <div className="flex-1 rounded-3xl border border-border/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF4EE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: v.tint }}>
                                  <Clock size={11} /> {slot.timeStart}–{slot.timeEnd}
                                </span>
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: v.glow, color: v.tint }}>{v.label}</span>
                              </div>
                              <h3 className="mt-2 text-lg font-bold leading-snug text-primary">{slot.activity}</h3>
                              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-secondary"><MapPin size={13} className="shrink-0" />{slot.location}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              {slot.costInrTotal != null && slot.costInrTotal > 0 && (
                                <p className="font-display text-xl font-bold text-primary">{formatInr(slot.costInrTotal)}</p>
                              )}
                              <p className="text-xs text-muted">{slot.durationMin} min</p>
                            </div>
                          </div>

                          {(slot.transportMode != null || slot.distanceKm != null) && (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-secondary">
                              {slot.transportMode != null && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F2ED] px-3 py-1.5">
                                  <Route size={12} />{slot.transportMode}{slot.transportDetail != null ? ` · ${slot.transportDetail}` : ''}
                                </span>
                              )}
                              {slot.distanceKm != null && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F2ED] px-3 py-1.5"><Navigation size={12} />{slot.distanceKm} km</span>
                              )}
                            </div>
                          )}

                          {(slot.highlights ?? []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {slot.highlights!.map((h) => (
                                <span key={h} className="rounded-full bg-[#0A6B66]/8 px-2.5 py-1 text-xs font-medium text-[#0A6B66]">{h}</span>
                              ))}
                            </div>
                          )}

                          {slot.tip != null && (
                            <p className="mt-3 flex gap-2 rounded-2xl bg-[#FFF6EE] px-3.5 py-2.5 text-sm text-[#8A4A24]">
                              <Lightbulb size={15} className="mt-0.5 shrink-0 text-[#E8622A]" /><span>{slot.tip}</span>
                            </p>
                          )}
                          {slot.photoSpot != null && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#D4548A]"><Camera size={13} />Photo spot: {slot.photoSpot}</p>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              )}

              {(day.dayTips ?? []).length > 0 && (
                <div className="mt-4 rounded-3xl border border-[#C9974A]/30 bg-[#FBF6EC] p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#946A1E]"><Sparkles size={15} />Insider tips for the day</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {day.dayTips!.map((t) => (
                      <li key={t} className="flex gap-2 text-sm text-secondary"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9974A]" />{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function ItineraryPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: itinerary, isLoading, isError } = useItinerary(id);
  const [activeSection, setActiveSection] = useState<'overview' | 'days' | 'hotels' | 'budget' | 'packing' | 'culture'>('overview');
  const [heroImageIdx, setHeroImageIdx] = useState(0);
  const preTrip = usePersistentChecklist(`itinerary:${id}:pretrip`);
  const packing = usePersistentChecklist(`itinerary:${id}:packing`);

  const { data: destinationData } = useQuery({
    queryKey: ['itinerary-destination-images', itinerary?.destination],
    queryFn: () => discoveryService.getDestinations({ search: itinerary?.destination ?? '', limit: 6, page: 1 }),
    enabled: itinerary?.destination != null,
    staleTime: 10 * 60 * 1000,
  });

  const matchingDestination = useMemo(() => {
    if (itinerary == null) return null;
    const normalized = itinerary.destination.toLowerCase();
    return destinationData?.data?.destinations?.find((dest) =>
      dest.name.toLowerCase() === normalized ||
      normalized.includes(dest.name.toLowerCase()) ||
      dest.name.toLowerCase().includes(normalized),
    ) ?? destinationData?.data?.destinations?.[0] ?? null;
  }, [destinationData, itinerary]);

  const heroImages = useMemo(() => {
    const destinationImages = matchingDestination == null
      ? []
      : [
        cleanImage(matchingDestination.heroImage.url),
        ...matchingDestination.galleryImages.map(cleanImage),
        ...matchingDestination.images.map((image) => cleanImage(image.url)),
      ];

    const itineraryImages = itinerary == null
      ? []
      : [
        cleanImage(itinerary.heroImage),
        ...itinerary.days.map((day) => cleanImage(day.heroImage?.url)),
      ];

    return Array.from(new Set([...destinationImages, ...itineraryImages, ...DISCOVER_HERO_IMAGES].filter(Boolean))) as string[];
  }, [itinerary, matchingDestination]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroImageIdx((current) => (current + 1) % Math.max(heroImages.length, 1));
    }, 5200);
    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  const budgetData = useMemo(() => {
    if (itinerary == null) return [];
    return [
      { name: 'Flights', value: itinerary.budgetBreakdown.flights.amount },
      { name: 'Hotels', value: itinerary.budgetBreakdown.accommodation.amount },
      { name: 'Food', value: itinerary.budgetBreakdown.food.amount },
      { name: 'Transport', value: itinerary.budgetBreakdown.transport.amount },
      { name: 'Activities', value: itinerary.budgetBreakdown.activities.amount },
      { name: 'Shopping', value: itinerary.budgetBreakdown.shopping.amount },
      { name: 'Misc', value: itinerary.budgetBreakdown.miscellaneous.amount },
    ].filter((item) => item.value > 0);
  }, [itinerary]);

  const dailySpend = useMemo(() => {
    if (itinerary == null) return [];
    return itinerary.days.map((day) => ({
      day: `D${day.dayNumber}`,
      amount: day.dayBudgetSummary?.dayTotalInr ?? day.totalEstimatedCost.amount,
    }));
  }, [itinerary]);

  if (isLoading) {
    return <PageLayout><FullPageSpinner /></PageLayout>;
  }

  if (isError || itinerary == null) {
    return (
      <PageLayout>
        <div className="page-container py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">Itinerary not found</h1>
          <Link to="/plan" className="btn-primary mt-6 inline-flex">Plan a trip</Link>
        </div>
      </PageLayout>
    );
  }

  const totalBudget = itinerary.budgetBreakdown.grandTotal ?? itinerary.budgetBreakdown.total;
  const travelers = itinerary.tripSummary?.totalTravelers ?? 1;
  const visualBudgetTotal = Math.max(
    totalBudget.amount,
    budgetData.reduce((sum, item) => sum + item.value, 0),
    1,
  );

  return (
    <PageLayout noPadding hideFooter>
      <section className="relative min-h-[620px] overflow-hidden bg-[#171412] text-white">
        {heroImages.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
            style={{ opacity: index === heroImageIdx ? 1 : 0 }}
          >
            <img
              src={src}
              alt={index === heroImageIdx ? itinerary.destination : ''}
              className="h-full w-full object-cover"
              style={{
                transform: index === heroImageIdx ? 'scale(1.11)' : 'scale(1)',
                transition: 'transform 8s ease-out',
                filter: 'brightness(0.86) saturate(1.08)',
              }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(232,98,42,0.16),transparent_45%,rgba(201,151,74,0.08))]" />

        <div className="page-container relative z-10 flex min-h-[620px] flex-col justify-between pb-10 pt-24 md:pt-28">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/plan" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition hover:bg-white/25">
              <ArrowLeft size={15} /> Back
            </Link>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/25">
                <Share2 size={15} /> Share
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/25">
                <Download size={15} /> PDF
              </button>
            </div>
          </div>

          <div className="grid items-end gap-6 lg:grid-cols-[1fr_340px]">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                <Sparkles size={14} /> Travel Sarthi Precision Plan
              </p>
              <h1 className="max-w-4xl font-display text-[clamp(2.5rem,6vw,5.3rem)] font-bold leading-[0.96] text-white drop-shadow-2xl">
                {itinerary.destination}
                {itinerary.country != null ? <span className="block text-white/86">{itinerary.country}</span> : null}
              </h1>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/85">
                <span className="rounded-full bg-white/14 px-3 py-1.5 backdrop-blur">{itinerary.durationDays} Days</span>
                <span className="rounded-full bg-white/14 px-3 py-1.5 backdrop-blur">{travelers} Travelers</span>
                <span className="rounded-full bg-white/14 px-3 py-1.5 backdrop-blur">{totalBudget.formatted} total</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/75">
                <span><Calendar size={14} className="mr-2 inline" />{itinerary.startDate} to {itinerary.endDate}</span>
                <span><MapPin size={14} className="mr-2 inline" />{itinerary.tripSummary?.weatherDuringTrip ?? 'Weather context unavailable'}</span>
              </div>
            </motion.div>

            <div className="rounded-[28px] border border-white/20 bg-white/13 p-5 shadow-2xl backdrop-blur-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Budget Snapshot</p>
              <p className="mt-3 text-4xl font-bold">{totalBudget.formatted}</p>
              <p className="mt-2 text-sm text-white/72">{itinerary.tripSummary?.budgetTier ?? 'Custom'} · {itinerary.budgetBreakdown.perPerson?.formatted ?? formatInr(Math.round(totalBudget.amount / travelers))} per person</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-white/58">Avg / day</p>
                  <p className="font-semibold">{formatInr(Math.round(totalBudget.amount / itinerary.durationDays))}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-white/58">Vs budget</p>
                  <p className="font-semibold capitalize">{itinerary.budgetBreakdown.vsBudget ?? 'within'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[linear-gradient(180deg,rgba(255,122,64,0.11)_0%,rgba(255,247,240,0.55)_320px,#fff_780px)]">
        <div className="sticky top-[68px] z-20 border-b border-border bg-[#FFFDF9]/90 backdrop-blur-2xl">
          <div className="page-container flex gap-3 overflow-x-auto py-3 scrollbar-hide">
            {[
              ['overview', 'Overview'],
              ['days', 'Day-by-Day'],
              ['hotels', 'Hotels'],
              ['budget', 'Budget'],
              ['packing', 'Packing'],
              ['culture', 'Cultural Guide'],
            ].map(([key, label]) => (
              <button
                key={key}
                className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition"
                style={{ background: activeSection === key ? '#E8622A' : '#fff', color: activeSection === key ? '#fff' : '#1A1208' }}
                onClick={() => setActiveSection(key as typeof activeSection)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="page-container py-10">
          {activeSection === 'overview' && (
            <section className="grid gap-7 lg:grid-cols-[1.35fr_0.9fr]">
              <div className="space-y-7">
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    ['Days', String(itinerary.durationDays)],
                    ['Travelers', String(travelers)],
                    ['Budget', totalBudget.formatted],
                    ['Style', itinerary.tripSummary?.budgetTier ?? 'Custom'],
                  ].map(([label, value]) => (
                    <div key={label} className="card p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
                      <p className="mt-3 font-display text-3xl font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-3xl font-bold text-primary">Pre-trip checklist</h2>
                    <span className="rounded-full bg-[#0A6B66]/10 px-3 py-1 text-xs font-semibold text-[#0A6B66]">
                      {(itinerary.preTripChecklist ?? []).filter((_, i) => preTrip.state[String(i)]).length}/{itinerary.preTripChecklist?.length ?? 0} done
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(itinerary.preTripChecklist ?? []).map((item, index) => (
                      <label key={index} className="flex items-start gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm text-secondary">
                        <input className="mt-1 accent-[#E8622A]" type="checkbox" checked={preTrip.state[String(index)] === true} onChange={() => preTrip.toggle(String(index))} />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-display text-3xl font-bold text-primary">Daily spend rhythm</h2>
                  <div className="mt-5 h-[230px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySpend}>
                        <CartesianGrid stroke="rgba(17,17,24,0.06)" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}k`} width={46} />
                        <Tooltip formatter={(value) => formatInr(Number(value))} cursor={{ fill: 'rgba(232,98,42,0.07)' }} />
                        <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#E8622A" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-display text-3xl font-bold text-primary">Budget split</h2>
                <p className="mt-1 text-sm text-secondary">Live from the generated itinerary totals.</p>
                <div className="mt-5 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={budgetData} dataKey="value" innerRadius={62} outerRadius={94} paddingAngle={4}>
                        {budgetData.map((entry, index) => <Cell key={entry.name} fill={BUDGET_COLORS[index % BUDGET_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => formatInr(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {budgetData.map((item, index) => (
                    <div key={item.name}>
                      <div className="mb-1 flex justify-between text-xs font-semibold text-secondary">
                        <span>{item.name}</span>
                        <span>{formatInr(item.value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#EEE8DF]">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.value / visualBudgetTotal) * 100)}%`, background: BUDGET_COLORS[index % BUDGET_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 rounded-2xl bg-[#E8622A]/8 px-4 py-3 text-center text-sm text-secondary">{itinerary.tripSummary?.exchangeRateNote}</p>
              </div>
            </section>
          )}

          {activeSection === 'days' && (
            <ItineraryDayDeck days={itinerary.days} fallbackImages={heroImages} />
          )}

          {activeSection === 'hotels' && (
            <section className="grid gap-5 lg:grid-cols-2">
              {(itinerary.hotels ?? []).map((hotel) => (
                <article key={`${hotel.name}-${hotel.area}`} className="card p-6">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">{hotel.tier} · {hotel.area}</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-primary">{hotel.name}</h2>
                  <p className="mt-3 text-sm text-secondary">{hotel.whyHere}</p>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-secondary">{hotel.nights} nights · {hotel.bookingPlatform}</span>
                    <span className="font-semibold text-primary">{formatInr(hotel.priceInrPerNight)}/night</span>
                  </div>
                </article>
              ))}
            </section>
          )}

          {activeSection === 'budget' && (
            <section className="grid gap-7 lg:grid-cols-[1fr_0.8fr]">
              <div className="card p-6">
                <h2 className="font-display text-3xl font-bold text-primary">Budget breakdown</h2>
                <div className="mt-5 space-y-3">
                  {budgetData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-secondary"><span className="h-2.5 w-2.5 rounded-full" style={{ background: BUDGET_COLORS[index % BUDGET_COLORS.length] }} />{item.name}</span>
                      <span className="font-semibold text-primary">{formatInr(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-[#0A6B66]/8 p-4 text-sm text-secondary">
                  <Wallet size={16} className="mr-2 inline text-[#0A6B66]" />
                  {itinerary.budgetBreakdown.vsBudget ?? 'within'} budget · {(itinerary.budgetBreakdown.savingsTips ?? []).join(' · ')}
                </div>
              </div>
              <div className="card p-6">
                <h2 className="font-display text-3xl font-bold text-primary">Cost by day</h2>
                <div className="mt-5 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySpend}>
                      <CartesianGrid stroke="rgba(17,17,24,0.06)" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}k`} width={48} />
                      <Tooltip formatter={(value) => formatInr(Number(value))} cursor={{ fill: 'rgba(232,98,42,0.07)' }} />
                      <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#0A6B66" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'packing' && (
            <section className="grid gap-5 lg:grid-cols-2">
              {Object.entries(itinerary.packingList ?? {}).map(([group, items]) => (
                <article key={group} className="card p-6">
                  <h2 className="font-display text-3xl font-bold capitalize text-primary">{group}</h2>
                  <div className="mt-4 space-y-3">
                    {(items as string[]).map((item) => {
                      const key = `${group}:${item}`;
                      return (
                        <label key={key} className="flex items-start gap-3 rounded-2xl bg-[#FAF8F5] px-4 py-3 text-sm text-secondary">
                          <input className="mt-1 accent-[#E8622A]" type="checkbox" checked={packing.state[key] === true} onChange={() => packing.toggle(key)} />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </section>
          )}

          {activeSection === 'culture' && (
            <section className="grid gap-5 lg:grid-cols-3">
              {[
                ['Do', itinerary.culturalGuide?.dos ?? []],
                ["Don't", itinerary.culturalGuide?.donts ?? []],
                ['Scams', itinerary.culturalGuide?.scamsToAvoid ?? []],
              ].map(([title, items]) => (
                <article key={title as string} className="card p-6">
                  <h2 className="font-display text-3xl font-bold text-primary">{title}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-secondary">
                    {(items as string[]).map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={15} className="mt-1 shrink-0 text-[#0A6B66]" />{item}</li>)}
                  </ul>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
