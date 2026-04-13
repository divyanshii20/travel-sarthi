import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Compass } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { DestinationCard } from '@/components/discovery/DestinationCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useDestinations } from '@/hooks/useDestinations';
import { containerVariants, itemVariants } from '@/lib/animations';
import { CONTINENT_OPTIONS } from '@/constants/destinations';
import type { DestinationContinent } from 'travel-sarthi-shared-types';

export function DiscoverPage() {
  const [activeContinent, setActiveContinent] = useState<DestinationContinent | 'all'>('all');

  const { data, isLoading, isError, refetch } = useDestinations(
    activeContinent !== 'all' ? { continent: activeContinent } : undefined
  );

  return (
    <PageLayout>
      <div className="page-container py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-primary mb-2">Discover Destinations</h1>
          <p className="text-secondary">AI-ranked destinations with real-time pricing and safety scores</p>
        </div>

        {/* Continent filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {CONTINENT_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveContinent(c.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeContinent === c.value
                  ? 'bg-saffron text-white'
                  : 'bg-card text-secondary hover:text-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isError && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,98,42,0.08)', border: '1px solid rgba(232,98,42,0.15)' }}>
              <Compass size={28} style={{ color: 'var(--color-saffron)' }} />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                Could not load destinations
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Please check your connection or try again.
              </p>
            </div>
            <button
              onClick={() => void refetch()}
              className="btn-primary gap-2"
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && !isError && data != null && data.destinations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(10,107,102,0.08)', border: '1px solid rgba(10,107,102,0.15)' }}>
              <Compass size={28} style={{ color: '#0A6B66' }} />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                No destinations found
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Try a different filter or check back soon.
              </p>
            </div>
          </div>
        )}

        {data != null && data.destinations.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {data.destinations.map((dest, i) => (
              <motion.div key={dest.id} variants={itemVariants}>
                <DestinationCard destination={dest} rank={i + 1} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
