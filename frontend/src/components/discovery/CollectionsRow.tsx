import type { FilterState } from './FilterBar';

interface Collection {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  gradient: string;
  filters: Partial<FilterState>;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'honeymoon',
    icon: '💑',
    title: 'Honeymoon Escapes',
    subtitle: 'Romance & luxury',
    gradient: 'linear-gradient(135deg, #500724 0%, #881337 100%)',
    filters: { tags: ['Romance'] },
  },
  {
    id: 'budget',
    icon: '💸',
    title: 'Under ₹1 Lakh Total',
    subtitle: 'Budget-friendly trips',
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
    filters: { budgetMax: 3000, sort: 'price' },
  },
  {
    id: 'visa-free',
    icon: '✈️',
    title: 'Visa-Free from India',
    subtitle: 'No paperwork needed',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
    filters: { visaStatus: 'visa_free' },
  },
  {
    id: 'december',
    icon: '🎄',
    title: 'December Best Picks',
    subtitle: 'Holiday season travel',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #c2410c 100%)',
    filters: { month: 12 },
  },
  {
    id: 'hidden',
    icon: '🌿',
    title: 'Hidden Gems 2025',
    subtitle: 'Off the beaten path',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    filters: { hiddenGem: true },
  },
  {
    id: 'weekend',
    icon: '⚡',
    title: 'Long Weekend Escapes',
    subtitle: 'Quick getaways',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)',
    filters: { tags: ['Weekend'] },
  },
  {
    id: 'trek',
    icon: '🏔️',
    title: 'Mountain & Trekking',
    subtitle: 'Adventure awaits',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
    filters: { tags: ['Trekking', 'Mountain'] },
  },
  {
    id: 'beach',
    icon: '🏖️',
    title: 'Best Beaches',
    subtitle: 'Sun, sand & sea',
    gradient: 'linear-gradient(135deg, #164e63 0%, #0e7490 100%)',
    filters: { tags: ['Beach'] },
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    title: 'Family Friendly',
    subtitle: 'Fun for everyone',
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    filters: { tags: ['Family'] },
  },
];

interface CollectionsRowProps {
  onCollectionClick: (filters: Partial<FilterState>) => void;
}

export function CollectionsRow({ onCollectionClick }: CollectionsRowProps) {
  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            Curated Collections
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Handpicked for every kind of traveler
          </p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
        {COLLECTIONS.map((col) => (
          <button
            key={col.id}
            onClick={() => onCollectionClick(col.filters)}
            className="shrink-0 relative overflow-hidden rounded-2xl flex flex-col justify-end text-left transition-all duration-300 hover:scale-105 group"
            style={{
              width: 180,
              height: 120,
              background: col.gradient,
              boxShadow: '0 6px 24px rgba(17,17,24,0.25)',
            }}
          >
            {/* Subtle noise overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
              }}
            />
            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Content */}
            <div className="relative px-3.5 pb-3">
              <span className="text-2xl leading-none block mb-1">{col.icon}</span>
              <p className="text-white font-display font-bold text-sm leading-tight">{col.title}</p>
              <p className="text-white/60 text-xs mt-0.5">{col.subtitle}</p>
            </div>

            {/* Hover shimmer */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
