import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterState {
  continent: string;
  tags: string[];
  visaStatus: string;
  budgetMax: number | null;
  safetyMin: number | null;
  month: number | null;
  isDomestic: boolean | null;
  hiddenGem: boolean | null;
  trending: boolean | null;
  sort: string;
  flightDuration: string;
  search: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  totalResults: number;
}

const CONTINENTS = [
  { label: 'All', value: '', icon: '🌍' },
  { label: 'India', value: 'india', icon: '🇮🇳' },
  { label: 'Asia', value: 'asia', icon: '🌏' },
  { label: 'Europe', value: 'europe', icon: '🏰' },
  { label: 'Middle East', value: 'middle_east', icon: '🕌' },
  { label: 'Africa', value: 'africa', icon: '🌍' },
  { label: 'Americas', value: 'americas', icon: '🗽' },
  { label: 'Oceania', value: 'oceania', icon: '🏝' },
];

const QUICK_FILTERS: Array<{ icon: string; label: string; key: keyof FilterState | 'tag'; value: string | boolean }> = [
  { icon: '✈', label: 'Visa Free', key: 'visaStatus', value: 'visa_free' },
  { icon: '⚡', label: 'On Arrival', key: 'visaStatus', value: 'visa_on_arrival' },
  { icon: '🏖', label: 'Beach', key: 'tag', value: 'Beach' },
  { icon: '🏔', label: 'Mountain', key: 'tag', value: 'Mountain' },
  { icon: '🏛', label: 'Heritage', key: 'tag', value: 'Heritage' },
  { icon: '💑', label: 'Romance', key: 'tag', value: 'Romance' },
  { icon: '🎒', label: 'Adventure', key: 'tag', value: 'Adventure' },
  { icon: '👨‍👩‍👧', label: 'Family', key: 'tag', value: 'Family' },
  { icon: '🌟', label: 'Hidden Gems', key: 'hiddenGem', value: true },
  { icon: '🔥', label: 'Trending', key: 'trending', value: true },
  { icon: '🌿', label: 'Wellness', key: 'tag', value: 'Wellness' },
  { icon: '🍜', label: 'Foodie', key: 'tag', value: 'Foodie' },
  { icon: '💎', label: 'Luxury', key: 'tag', value: 'Luxury' },
  { icon: '🌙', label: 'Nightlife', key: 'tag', value: 'Nightlife' },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SORT_OPTIONS = [
  { label: 'Best Match', value: 'score' },
  { label: 'Trending', value: 'trending' },
  { label: 'Budget ↑', value: 'price' },
  { label: 'Safety', value: 'safety' },
  { label: 'Popular', value: 'popularity' },
  { label: 'A-Z', value: 'az' },
];

function isQuickFilterActive(filters: FilterState, qf: typeof QUICK_FILTERS[number]): boolean {
  if (qf.key === 'tag') return filters.tags.includes(qf.value as string);
  if (qf.key === 'hiddenGem') return filters.hiddenGem === true;
  if (qf.key === 'trending') return filters.trending === true;
  if (qf.key === 'visaStatus') return filters.visaStatus === qf.value;
  return false;
}

function toggleQuickFilter(filters: FilterState, qf: typeof QUICK_FILTERS[number]): FilterState {
  const active = isQuickFilterActive(filters, qf);
  if (qf.key === 'tag') {
    const tag = qf.value as string;
    return {
      ...filters,
      tags: active ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag],
    };
  }
  if (qf.key === 'hiddenGem') return { ...filters, hiddenGem: active ? null : true };
  if (qf.key === 'trending') return { ...filters, trending: active ? null : true };
  if (qf.key === 'visaStatus') return { ...filters, visaStatus: active ? '' : (qf.value as string) };
  return filters;
}

export function FilterBar({ filters, onFiltersChange, totalResults }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const handleContinent = (val: string) => {
    onFiltersChange({ ...filters, continent: val, isDomestic: null });
  };

  const activeContinentKey = filters.continent;

  const activeCount =
    (filters.tags.length) +
    (filters.visaStatus ? 1 : 0) +
    (filters.budgetMax != null ? 1 : 0) +
    (filters.safetyMin != null ? 1 : 0) +
    (filters.month != null ? 1 : 0) +
    (filters.hiddenGem === true ? 1 : 0) +
    (filters.trending === true ? 1 : 0) +
    (filters.flightDuration ? 1 : 0);

  return (
    <div
      className="z-40 bg-page/95"
      style={{
        position: 'sticky',
        top: 64,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-card)',
        boxShadow: '0 2px 12px rgba(17,17,24,0.06)',
      }}
    >
      <div className="page-container py-2.5 flex flex-col gap-2">
        {/* Row 1: Continent pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {CONTINENTS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleContinent(c.value)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: activeContinentKey === c.value
                  ? 'var(--color-saffron)'
                  : 'var(--bg-surface)',
                color: activeContinentKey === c.value ? 'white' : 'var(--text-secondary)',
                border: `1.5px solid ${activeContinentKey === c.value ? 'var(--color-saffron)' : 'var(--border-card)'}`,
                fontSize: 13,
              }}
            >
              <span className="mr-1">{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        {/* Row 2: Quick filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {QUICK_FILTERS.map((qf) => {
            const active = isQuickFilterActive(filters, qf);
            return (
              <button
                key={qf.label}
                onClick={() => onFiltersChange(toggleQuickFilter(filters, qf))}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: active ? 'rgba(232,98,42,0.12)' : 'var(--bg-surface)',
                  color: active ? 'var(--color-saffron)' : 'var(--text-secondary)',
                  border: `1.5px solid ${active ? 'var(--color-saffron)' : 'var(--border-card)'}`,
                }}
              >
                <span>{qf.icon}</span>
                {qf.label}
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-border-border shrink-0" style={{ background: 'var(--border-card)' }} />

          {/* Advanced filters toggle */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background: expanded || activeCount > 0 ? 'rgba(10,107,102,0.10)' : 'var(--bg-surface)',
              color: expanded || activeCount > 0 ? 'var(--color-teal)' : 'var(--text-secondary)',
              border: `1.5px solid ${expanded ? 'var(--color-teal)' : 'var(--border-card)'}`,
            }}
          >
            <SlidersHorizontal size={13} />
            Filters {activeCount > 0 && <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: 'var(--color-saffron)', lineHeight: 1 }}>{activeCount}</span>}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Row 3: Advanced filters (expandable) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflow: 'hidden' }}
            >
              <div
                className="rounded-2xl p-4 mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)' }}
              >
                {/* Budget slider */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Max Budget/Day{filters.budgetMax != null ? `: ₹${filters.budgetMax.toLocaleString('en-IN')}` : ': Any'}
                  </p>
                  <input
                    type="range"
                    min={500}
                    max={25000}
                    step={500}
                    value={filters.budgetMax ?? 25000}
                    onChange={(e) => onFiltersChange({ ...filters, budgetMax: Number(e.target.value) === 25000 ? null : Number(e.target.value) })}
                    className="w-full accent-orange-500"
                    style={{ accentColor: 'var(--color-saffron)' }}
                  />
                  <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span>₹500</span>
                    <span>₹25k+</span>
                  </div>
                </div>

                {/* Safety minimum */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Safety Score Min</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[null, 70, 80, 90, 95].map((v) => (
                      <button
                        key={v ?? 'any'}
                        onClick={() => onFiltersChange({ ...filters, safetyMin: v })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: filters.safetyMin === v ? 'var(--color-teal)' : 'var(--bg-card)',
                          color: filters.safetyMin === v ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${filters.safetyMin === v ? 'var(--color-teal)' : 'var(--border-card)'}`,
                        }}
                      >
                        {v == null ? 'Any' : `${v}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Best month */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Best Month</p>
                  <div className="flex gap-1 flex-wrap">
                    {MONTHS_SHORT.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => onFiltersChange({ ...filters, month: filters.month === i + 1 ? null : i + 1 })}
                        className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: filters.month === i + 1 ? 'var(--color-saffron)' : 'var(--bg-card)',
                          color: filters.month === i + 1 ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${filters.month === i + 1 ? 'var(--color-saffron)' : 'var(--border-card)'}`,
                          fontSize: 11,
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flight duration */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Flight Duration</p>
                  <div className="flex gap-1.5">
                    {[{ label: 'Any', value: '' }, { label: '<4hr', value: '<4' }, { label: '4-8hr', value: '4-8' }, { label: '8hr+', value: '8+' }].map((o) => (
                      <button
                        key={o.value}
                        onClick={() => onFiltersChange({ ...filters, flightDuration: o.value })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: filters.flightDuration === o.value ? 'var(--color-gold)' : 'var(--bg-card)',
                          color: filters.flightDuration === o.value ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${filters.flightDuration === o.value ? 'var(--color-gold)' : 'var(--border-card)'}`,
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Sort By</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {SORT_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => onFiltersChange({ ...filters, sort: s.value })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: filters.sort === s.value ? 'var(--text-primary)' : 'var(--bg-card)',
                          color: filters.sort === s.value ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${filters.sort === s.value ? 'var(--text-primary)' : 'var(--border-card)'}`,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear all */}
                {activeCount > 0 && (
                  <div className="flex items-end">
                    <button
                      onClick={() => onFiltersChange({
                        continent: '', tags: [], visaStatus: '', budgetMax: null,
                        safetyMin: null, month: null, isDomestic: null,
                        hiddenGem: null, trending: null, sort: 'score',
                        flightDuration: '', search: filters.search,
                      })}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                      style={{ background: 'rgba(232,85,85,0.1)', color: 'var(--color-coral)', border: '1px solid rgba(232,85,85,0.2)' }}
                    >
                      <X size={12} />
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter summary */}
        {(activeCount > 0 || filters.search.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Showing {totalResults} results
            </span>
            <span className="text-xs" style={{ color: 'var(--border-card)' }}>·</span>
            {filters.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: 'rgba(232,98,42,0.1)', color: 'var(--color-saffron)', border: '1px solid rgba(232,98,42,0.2)' }}
                onClick={() => onFiltersChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) })}
              >
                {tag} <X size={10} />
              </span>
            ))}
            {filters.visaStatus && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}
                onClick={() => onFiltersChange({ ...filters, visaStatus: '' })}
              >
                {filters.visaStatus.replace(/_/g, ' ')} <X size={10} />
              </span>
            )}
            {filters.hiddenGem === true && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}
                onClick={() => onFiltersChange({ ...filters, hiddenGem: null })}
              >
                Hidden Gems <X size={10} />
              </span>
            )}
            {filters.trending === true && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
                onClick={() => onFiltersChange({ ...filters, trending: null })}
              >
                Trending <X size={10} />
              </span>
            )}
            {filters.month != null && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.2)' }}
                onClick={() => onFiltersChange({ ...filters, month: null })}
              >
                {MONTHS_SHORT[filters.month - 1]} <X size={10} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
