import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Calendar, Download, MapPin, Share2, Wallet } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useItinerary } from '@/hooks/useItinerary';

const COLORS = ['#E8601C', '#2D5A4F', '#C9963A', '#8B7355', '#1B6CA8'];

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

export function ItineraryPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: itinerary, isLoading, isError } = useItinerary(id);
  const [activeSection, setActiveSection] = useState<'overview' | 'days' | 'hotels' | 'budget' | 'packing' | 'culture'>('overview');
  const preTrip = usePersistentChecklist(`itinerary:${id}:pretrip`);
  const packing = usePersistentChecklist(`itinerary:${id}:packing`);

  const budgetData = useMemo(() => {
    if (itinerary == null) return [];
    return [
      { name: 'Hotels', value: itinerary.budgetBreakdown.accommodation.amount },
      { name: 'Food', value: itinerary.budgetBreakdown.food.amount },
      { name: 'Transport', value: itinerary.budgetBreakdown.transport.amount },
      { name: 'Activities', value: itinerary.budgetBreakdown.activities.amount },
      { name: 'Shopping', value: itinerary.budgetBreakdown.shopping.amount },
    ];
  }, [itinerary]);

  if (isLoading) {
    return <PageLayout><FullPageSpinner /></PageLayout>;
  }

  if (isError || itinerary == null) {
    return (
      <PageLayout>
        <div className="page-container py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">Itinerary not found</h1>
          <Link to="/plan" className="btn-primary inline-flex mt-6">Plan a trip</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout noPadding hideFooter>
      <section className="relative min-h-[520px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={itinerary.heroImage ?? itinerary.days[0]?.heroImage.url ?? ''} alt={itinerary.destination} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15" />
        </div>
        <div className="page-container relative z-10 flex min-h-[520px] flex-col justify-between py-8 text-white">
          <div className="flex items-center justify-between">
            <Link to="/plan" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <ArrowLeft size={15} /> Back
            </Link>
            <div className="flex gap-2">
              <button className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur"><Share2 size={15} className="inline mr-2" />Share</button>
              <button className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur"><Download size={15} className="inline mr-2" />PDF</button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/70">Travel Sarthi Precision Plan</p>
              <h1 className="font-display text-5xl font-bold leading-none">
                {itinerary.flag != null ? `${itinerary.flag} ` : ''}{itinerary.destination}
                {itinerary.country != null ? `, ${itinerary.country}` : ''}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
                <span>{itinerary.durationDays} Days</span>
                <span>{itinerary.tripSummary?.totalTravelers ?? 0} Travelers</span>
                <span>{itinerary.budgetBreakdown.grandTotal?.formatted ?? itinerary.budgetBreakdown.total.formatted} total</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
                <span><Calendar size={14} className="inline mr-2" />{itinerary.startDate} to {itinerary.endDate}</span>
                <span><MapPin size={14} className="inline mr-2" />{itinerary.tripSummary?.weatherDuringTrip ?? 'Weather context unavailable'}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Budget Snapshot</p>
              <p className="mt-3 text-3xl font-bold">{itinerary.budgetBreakdown.grandTotal?.formatted ?? itinerary.budgetBreakdown.total.formatted}</p>
              <p className="mt-1 text-sm text-white/70">{itinerary.tripSummary?.budgetTier ?? 'Custom'} · {itinerary.budgetBreakdown.perPerson?.formatted ?? itinerary.budgetBreakdown.total.formatted} per person</p>
              <p className="mt-4 text-sm text-white/70">Vs budget: <span className="font-semibold text-white">{itinerary.budgetBreakdown.vsBudget ?? 'within'}</span></p>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-20 border-b border-border bg-[#FAF8F4]/95 backdrop-blur">
        <div className="page-container flex gap-3 overflow-x-auto py-3">
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
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: activeSection === key ? '#E8601C' : '#fff', color: activeSection === key ? '#fff' : '#1A1208' }}
              onClick={() => setActiveSection(key as typeof activeSection)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container py-8">
        {activeSection === 'overview' && (
          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  ['Days', String(itinerary.durationDays)],
                  ['Travelers', String(itinerary.tripSummary?.totalTravelers ?? 0)],
                  ['Budget', itinerary.budgetBreakdown.grandTotal?.formatted ?? itinerary.budgetBreakdown.total.formatted],
                  ['Style', itinerary.tripSummary?.budgetTier ?? 'Custom'],
                ].map(([label, value]) => (
                  <div key={label} className="card p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-primary">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card p-5">
                <h2 className="font-display text-2xl font-bold text-primary">Pre-trip checklist</h2>
                <div className="mt-4 space-y-3">
                  {(itinerary.preTripChecklist ?? []).map((item, index) => (
                    <label key={index} className="flex items-start gap-3 text-sm text-secondary">
                      <input type="checkbox" checked={preTrip.state[String(index)] === true} onChange={() => preTrip.toggle(String(index))} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display text-2xl font-bold text-primary">Budget split</h2>
              <div className="mt-5 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={budgetData} dataKey="value" innerRadius={58} outerRadius={90} paddingAngle={4}>
                      {budgetData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm text-secondary">{itinerary.tripSummary?.exchangeRateNote}</p>
            </div>
          </section>
        )}

        {activeSection === 'days' && (
          <section className="space-y-6">
            {itinerary.days.map((day) => (
              <article key={day.dayNumber} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="font-display text-3xl font-bold text-primary">Day {day.dayNumber} — {day.dayLabel ?? day.city}</h2>
                    <p className="mt-1 text-sm text-secondary">{day.date} · {day.theme ?? day.neighborhoodFocus}</p>
                  </div>
                  <div className="rounded-full bg-[#2D5A4F]/10 px-4 py-2 text-sm font-semibold text-[#2D5A4F]">
                    {day.dayBudgetSummary != null ? `₹${day.dayBudgetSummary.dayTotalInr.toLocaleString('en-IN')}` : day.totalEstimatedCost.formatted}
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {(day.slots ?? []).map((slot) => (
                    <div key={slot.slotId} className="rounded-2xl border border-border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted">{slot.timeStart} - {slot.timeEnd}</p>
                          <h3 className="mt-1 text-lg font-semibold text-primary">{slot.activity}</h3>
                          <p className="mt-1 text-sm text-secondary">{slot.location}</p>
                        </div>
                        <div className="text-right text-sm text-secondary">
                          <p>{slot.durationMin} min</p>
                          {slot.costInrTotal != null ? <p className="font-semibold text-primary">₹{slot.costInrTotal.toLocaleString('en-IN')}</p> : null}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-secondary md:grid-cols-2">
                        {slot.transportMode != null ? <p>Transport: {slot.transportMode} {slot.transportDetail != null ? `· ${slot.transportDetail}` : ''}</p> : null}
                        {slot.distanceKm != null ? <p>Distance: {slot.distanceKm} km</p> : null}
                        {slot.tip != null ? <p>Tip: {slot.tip}</p> : null}
                        {slot.photoSpot != null ? <p>Photo spot: {slot.photoSpot}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeSection === 'hotels' && (
          <section className="grid gap-5 lg:grid-cols-2">
            {(itinerary.hotels ?? []).map((hotel) => (
              <article key={`${hotel.name}-${hotel.area}`} className="card p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{hotel.tier} · {hotel.area}</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary">{hotel.name}</h2>
                <p className="mt-3 text-sm text-secondary">{hotel.whyHere}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-secondary">{hotel.nights} nights · {hotel.bookingPlatform}</span>
                  <span className="font-semibold text-primary">₹{hotel.priceInrPerNight.toLocaleString('en-IN')}/night</span>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeSection === 'budget' && (
          <section className="card p-5">
            <h2 className="font-display text-2xl font-bold text-primary">Budget breakdown</h2>
            <div className="mt-5 space-y-3">
              {[
                ['Flights', itinerary.budgetBreakdown.flights.formatted],
                ['Hotels', itinerary.budgetBreakdown.accommodation.formatted],
                ['Food', itinerary.budgetBreakdown.food.formatted],
                ['Transport', itinerary.budgetBreakdown.transport.formatted],
                ['Activities', itinerary.budgetBreakdown.activities.formatted],
                ['Shopping', itinerary.budgetBreakdown.shopping.formatted],
                ['Misc', itinerary.budgetBreakdown.miscellaneous.formatted],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm text-secondary">{label}</span>
                  <span className="font-semibold text-primary">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-[#2D5A4F]/8 p-4 text-sm text-secondary">
              <Wallet size={16} className="inline mr-2 text-[#2D5A4F]" />
              {itinerary.budgetBreakdown.vsBudget ?? 'within'} budget · {(itinerary.budgetBreakdown.savingsTips ?? []).join(' · ')}
            </div>
          </section>
        )}

        {activeSection === 'packing' && (
          <section className="grid gap-5 lg:grid-cols-2">
            {Object.entries(itinerary.packingList ?? {}).map(([group, items]) => (
              <article key={group} className="card p-5">
                <h2 className="font-display text-2xl font-bold capitalize text-primary">{group}</h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => {
                    const key = `${group}:${item}`;
                    return (
                      <label key={key} className="flex items-start gap-3 text-sm text-secondary">
                        <input type="checkbox" checked={packing.state[key] === true} onChange={() => packing.toggle(key)} />
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
              <article key={title} className="card p-5">
                <h2 className="font-display text-2xl font-bold text-primary">{title}</h2>
                <ul className="mt-4 space-y-3 text-sm text-secondary">
                  {items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </section>
        )}
      </div>
    </PageLayout>
  );
}
