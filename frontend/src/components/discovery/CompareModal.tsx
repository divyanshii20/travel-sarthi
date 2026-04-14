import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Sun, Building2, Star, Plane, Calendar, TrendingUp } from 'lucide-react';
import type { Destination } from 'travel-sarthi-shared-types';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FALLBACK = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=60';

function formatBestMonths(months: number[]): string {
  if (months.length === 0) return '—';
  return months.slice(0, 3).map((m) => MONTHS_SHORT[m - 1]).join(', ');
}

function getVisaLabel(type: string): string {
  switch (type) {
    case 'visa_free': return 'Visa Free ✓';
    case 'visa_on_arrival': return 'On Arrival';
    case 'e_visa': return 'E-Visa';
    default: return 'Visa Required';
  }
}

interface CompareRow {
  icon: React.ElementType;
  label: string;
  getValue: (d: Destination) => number | string;
  isNumeric?: boolean;
  higherIsBetter?: boolean;
  format?: (v: number | string) => string;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    icon: TrendingUp,
    label: 'Overall Score',
    getValue: (d) => d.score.overall,
    isNumeric: true,
    higherIsBetter: true,
    format: (v) => `${v}/100`,
  },
  {
    icon: Shield,
    label: 'Safety Score',
    getValue: (d) => d.score.safety * 10,
    isNumeric: true,
    higherIsBetter: true,
    format: (v) => `${v}/100`,
  },
  {
    icon: Sun,
    label: 'Weather Score',
    getValue: (d) => d.score.weatherScore * 10,
    isNumeric: true,
    higherIsBetter: true,
    format: (v) => `${v}/100`,
  },
  {
    icon: Building2,
    label: 'Infrastructure',
    getValue: (d) => d.infrastructureScore,
    isNumeric: true,
    higherIsBetter: true,
    format: (v) => `${v}/100`,
  },
  {
    icon: Star,
    label: 'Value Score',
    getValue: (d) => d.valueScore,
    isNumeric: true,
    higherIsBetter: true,
    format: (v) => `${v}/100`,
  },
  {
    icon: Plane,
    label: 'Budget/Day',
    getValue: (d) => d.budgetMidPerDay ?? d.budgetPerDay ?? 0,
    isNumeric: true,
    higherIsBetter: false,
    format: (v) => `₹${Number(v).toLocaleString('en-IN')}`,
  },
  {
    icon: X,
    label: 'Visa Status',
    getValue: (d) => getVisaLabel(d.visa.type),
    isNumeric: false,
  },
  {
    icon: Calendar,
    label: 'Best Months',
    getValue: (d) => formatBestMonths(d.bestMonths),
    isNumeric: false,
  },
  {
    icon: Plane,
    label: 'Direct Flights',
    getValue: (d) => d.directFlightCities.length > 0 ? d.directFlightCities.slice(0, 2).join(', ') : 'None',
    isNumeric: false,
  },
  {
    icon: TrendingUp,
    label: 'Rank',
    getValue: (d) => d.rank,
    isNumeric: true,
    higherIsBetter: false,
    format: (v) => `#${v}`,
  },
];

function getWinnerIdx(destinations: Destination[], row: CompareRow): number | null {
  if (!row.isNumeric) return null;
  const values = destinations.map((d) => Number(row.getValue(d)));
  if (values.some(isNaN)) return null;
  const best = row.higherIsBetter === true
    ? Math.max(...values)
    : Math.min(...values);
  const idx = values.indexOf(best);
  return idx;
}

interface CompareModalProps {
  destinations: Destination[];
  onClose: () => void;
}

export function CompareModal({ destinations, onClose }: CompareModalProps) {
  const navigate = useNavigate();
  const isOpen = destinations.length >= 2;

  if (!isOpen) return null;

  const bestOverall = destinations.reduce((best, d) => d.score.overall > best.score.overall ? d : best, destinations[0]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white w-full overflow-hidden z-10"
            style={{
              maxWidth: 900,
              maxHeight: '90vh',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border-card)' }}
            >
              <div>
                <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                  Compare Destinations
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Side-by-side comparison · Winner highlighted
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th
                      className="text-left text-xs font-semibold px-5 py-3 sticky left-0 z-10"
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        borderBottom: '1px solid var(--border-card)',
                        minWidth: 150,
                      }}
                    >
                      Metric
                    </th>
                    {destinations.map((dest, i) => (
                      <th
                        key={dest.id}
                        className="text-center px-4 py-3"
                        style={{
                          background: i === 0 ? 'rgba(232,98,42,0.04)' : i === 1 ? 'rgba(10,107,102,0.04)' : 'rgba(201,151,74,0.04)',
                          borderBottom: '1px solid var(--border-card)',
                          minWidth: 180,
                          borderLeft: '1px solid var(--border-card)',
                        }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-xl overflow-hidden">
                            <img
                              src={dest.heroImage.url}
                              alt={dest.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = FALLBACK; }}
                            />
                          </div>
                          <div>
                            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {dest.flagEmoji != null ? `${dest.flagEmoji} ` : ''}{dest.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dest.country}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, rowIdx) => {
                    const winnerIdx = getWinnerIdx(destinations, row);
                    const Icon = row.icon;
                    return (
                      <tr
                        key={row.label}
                        style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(17,17,24,0.018)' }}
                      >
                        <td
                          className="px-5 py-3 text-xs font-semibold sticky left-0"
                          style={{
                            background: rowIdx % 2 === 0 ? 'var(--bg-card)' : 'rgba(245,243,239,0.95)',
                            color: 'var(--text-secondary)',
                            borderBottom: '1px solid var(--border-card)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                            {row.label}
                          </div>
                        </td>
                        {destinations.map((dest, destIdx) => {
                          const rawVal = row.getValue(dest);
                          const displayVal = row.format != null ? row.format(rawVal) : String(rawVal);
                          const isWinner = winnerIdx === destIdx;
                          return (
                            <td
                              key={dest.id}
                              className="px-4 py-3 text-center"
                              style={{
                                borderBottom: '1px solid var(--border-card)',
                                borderLeft: '1px solid var(--border-card)',
                                background: isWinner
                                  ? 'rgba(232,98,42,0.07)'
                                  : 'transparent',
                              }}
                            >
                              <span
                                className="text-sm font-semibold"
                                style={{
                                  color: isWinner ? 'var(--color-saffron)' : 'var(--text-primary)',
                                  fontWeight: isWinner ? 700 : 500,
                                }}
                              >
                                {displayVal}
                                {isWinner && <span className="ml-1 text-xs">★</span>}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer CTA */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid var(--border-card)', background: 'var(--bg-surface)' }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Best overall match:</p>
                <p className="font-display font-bold text-base" style={{ color: 'var(--color-saffron)' }}>
                  {bestOverall.flagEmoji != null ? `${bestOverall.flagEmoji} ` : ''}{bestOverall.name}
                </p>
              </div>
              <button
                className="btn-primary gap-2 text-sm"
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)' }}
                onClick={() => {
                  onClose();
                  navigate(`/plan?destination=${bestOverall.slug}&mode=a`);
                }}
              >
                <Plane size={15} />
                Plan Trip to {bestOverall.name}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
