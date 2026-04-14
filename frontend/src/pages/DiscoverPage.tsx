import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, X, RefreshCw, Compass, TrendingUp, Gem } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { DestinationCard } from '@/components/discovery/DestinationCard';
import { DestinationModal } from '@/components/discovery/DestinationModal';
import { CompareModal } from '@/components/discovery/CompareModal';
import { FilterBar, type FilterState } from '@/components/discovery/FilterBar';
import { TrendingTicker } from '@/components/discovery/TrendingTicker';
import { CollectionsRow } from '@/components/discovery/CollectionsRow';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { discoveryService } from '@/services/discovery.service';
import { containerVariants, itemVariants } from '@/lib/animations';
import type { Destination } from 'travel-sarthi-shared-types';

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80',
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1400&q=80',
];

const INITIAL_FILTERS: FilterState = {
  continent: '',
  tags: [],
  visaStatus: '',
  budgetMax: null,
  safetyMin: null,
  month: null,
  isDomestic: null,
  hiddenGem: null,
  trending: null,
  sort: 'score',
  flightDuration: '',
  search: '',
};

export function DiscoverPage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [compareList, setCompareList] = useState<Destination[]>([]);
  const [modalDest, setModalDest] = useState<Destination | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState('');
  const [heroImageIdx, setHeroImageIdx] = useState(0);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [aiResults, setAiResults] = useState<Destination[] | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Rotate hero background
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIdx((i) => (i + 1) % FALLBACK_HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['destinations', filters, page],
    queryFn: () =>
      discoveryService.getDestinations({
        continent: filters.continent || undefined,
        tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
        visaStatus: filters.visaStatus || undefined,
        budgetMax: filters.budgetMax ?? undefined,
        safetyMin: filters.safetyMin ?? undefined,
        month: filters.month ?? undefined,
        isDomestic: filters.isDomestic ?? undefined,
        hiddenGem: filters.hiddenGem ?? undefined,
        trending: filters.trending ?? undefined,
        sortBy: (filters.sort || 'score') as 'score' | 'price' | 'safety' | 'trending' | 'hidden_gem' | 'popularity',
        search: filters.search || undefined,
        flightDuration: filters.flightDuration || undefined,
        page,
        limit: 24,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Trending destinations query (top 6 by trendingScore)
  const { data: trendingData } = useQuery({
    queryKey: ['destinations-trending'],
    queryFn: () => discoveryService.getDestinations({ sortBy: 'trending', limit: 6, page: 1 }),
    staleTime: 10 * 60 * 1000,
  });

  // Hidden gems query
  const { data: hiddenGemsData } = useQuery({
    queryKey: ['destinations-hidden-gems'],
    queryFn: () => discoveryService.getDestinations({ hiddenGem: true, limit: 4, page: 1 }),
    staleTime: 10 * 60 * 1000,
  });

  // Accumulate destinations across pages
  useEffect(() => {
    if (data?.data?.destinations != null) {
      if (page === 1) {
        setAllDestinations(data.data.destinations);
      } else {
        setAllDestinations((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const newOnes = data.data!.destinations.filter((d) => !existingIds.has(d.id));
          return [...prev, ...newOnes];
        });
      }
    }
  }, [data, page]);

  // Reset page when filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    setAiResults(null);
    setAiQuery('');
  }, []);

  const handleAiSearch = async () => {
    if (aiSearchInput.trim().length === 0) return;
    setIsAiSearching(true);
    setAiError('');
    try {
      const res = await discoveryService.aiSearch(aiSearchInput.trim());
      if (res.data != null) {
        setAiResults(res.data.destinations);
        setAiQuery(aiSearchInput.trim());
      } else {
        setAiError('AI search failed. Please try again.');
      }
    } catch {
      setAiError('AI search failed. Please try again.');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleCompareToggle = useCallback((dest: Destination) => {
    setCompareList((prev) => {
      if (prev.some((d) => d.id === dest.id)) {
        return prev.filter((d) => d.id !== dest.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, dest];
    });
  }, []);

  const displayedDestinations = aiResults != null ? aiResults : allDestinations;
  const totalResults = aiResults != null ? aiResults.length : (data?.meta?.total ?? 0);
  const trendingItems = (trendingData?.data?.destinations ?? [])
    .filter((d) => d.isTrending)
    .map((d) => ({ name: d.name, changePct: d.trendingChangePct }));
  const trendingCards = trendingData?.data?.destinations ?? [];
  const hiddenGems = hiddenGemsData?.data?.destinations ?? [];
  const hasMore = data?.meta != null &&
    data.meta.page < data.meta.totalPages &&
    aiResults == null;

  return (
    <PageLayout noPadding>
      {/* [A] HERO — Premium Cinematic */}
      <div className="relative overflow-hidden" style={{ height: 440, minHeight: 340 }}>
        {/* Rotating background images with Ken Burns zoom */}
        {FALLBACK_HERO_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[1.5s] ease-in-out"
            style={{ opacity: i === heroImageIdx ? 1 : 0 }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                transform: i === heroImageIdx ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 8s ease-out',
              }}
              onError={() => {}}
            />
          </div>
        ))}
        {/* Cinematic multi-layer overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.75) 100%)' }} />
        {/* Subtle warm tint overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(232,98,42,0.08) 0%, transparent 50%, rgba(244,162,97,0.06) 100%)' }} />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center" style={{ paddingTop: 64 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {/* Gold accent line */}
            <div className="mx-auto mb-4 w-10 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, transparent, var(--color-gold), transparent)' }} />

            <p className="text-xs font-semibold mb-3 tracking-[0.25em] uppercase" style={{ color: 'var(--color-gold-light, #F4A261)' }}>
              Travel Sarthi · AI-Powered Discovery
            </p>
            <h1 className="font-display font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              Discover Your Next
              <span className="block" style={{ background: 'linear-gradient(to right, #F4A261, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Extraordinary Journey
              </span>
            </h1>
            <p className="text-white/60 text-sm mb-2 font-light tracking-wide">
              350+ handpicked destinations across 7 continents
            </p>
            <p className="text-white/40 text-xs mb-7 flex items-center justify-center gap-3">
              <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-400/80" /> AI-Ranked</span>
              <span>·</span>
              <span>Real Prices in INR</span>
              <span>·</span>
              <span>Visa Info for Indians</span>
            </p>

            {/* Premium Search bar */}
            <div
              className="flex items-center gap-2 mx-auto group"
              style={{
                maxWidth: 600,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px) saturate(180%)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '7px 7px 7px 18px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <Search size={18} color="rgba(255,255,255,0.5)" className="shrink-0" />
              <input
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm font-light"
                placeholder="Ask AI: 'beach in December visa-free under ₹3k/day'..."
                value={aiSearchInput}
                onChange={(e) => setAiSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAiSearch(); }}
                style={{ letterSpacing: '0.01em' }}
              />
              <button
                className="flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 shrink-0 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--color-saffron), #E8622A)',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(232,98,42,0.35)',
                }}
                onClick={() => void handleAiSearch()}
                disabled={isAiSearching}
              >
                {isAiSearching ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                {isAiSearching ? 'Searching...' : 'AI Search'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* [B] Trending Ticker */}
      {trendingItems.length > 0 && <TrendingTicker items={trendingItems} />}

      {/* [C] FilterBar */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalResults={totalResults}
      />

      {/* [D] AI Search result banner */}
      <AnimatePresence>
        {aiQuery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="page-container mt-4"
          >
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderLeft: '4px solid #16a34a',
                color: '#15803d',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} />
                AI found {aiResults?.length ?? 0} destinations matching "{aiQuery}"
              </div>
              <button
                onClick={() => { setAiResults(null); setAiQuery(''); setAiSearchInput(''); }}
                className="flex items-center gap-1 text-xs hover:opacity-70"
              >
                <X size={13} /> Clear
              </button>
            </div>
            {aiError.length > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-coral)' }}>{aiError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* [E] Trending horizontal scroll */}
      {trendingCards.length > 0 && aiResults == null && (
        <div className="page-container mt-8 mb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp size={20} style={{ color: 'var(--color-saffron)' }} />
                Trending Right Now
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Destinations gaining popularity fast</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
            {trendingCards.map((dest) => (
              <div
                key={dest.id}
                className="shrink-0 relative overflow-hidden rounded-2xl cursor-pointer group"
                style={{ width: 340, height: 200 }}
                onClick={() => setModalDest(dest)}
              >
                <img
                  src={dest.heroImage.url}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = FALLBACK_HERO_IMAGES[0]; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {dest.isTrending && (
                  <div
                    className="absolute top-3 right-3 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(22,163,74,0.85)', backdropFilter: 'blur(6px)' }}
                  >
                    <TrendingUp size={11} />
                    +{Math.round(dest.trendingChangePct)}%
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-display font-bold text-lg leading-tight">
                    {dest.flagEmoji != null ? `${dest.flagEmoji} ` : ''}{dest.name}
                  </p>
                  <p className="text-white/70 text-xs">{dest.country} · {dest.tagline.slice(0, 40)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* [F] MAIN GRID */}
      <div className="page-container mt-8">
        {isError && aiResults == null && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,98,42,0.08)', border: '1px solid rgba(232,98,42,0.15)' }}
            >
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
            <button onClick={() => void refetch()} className="btn-primary gap-2">
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {isLoading && page === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 24 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && !isError && displayedDestinations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(10,107,102,0.08)', border: '1px solid rgba(10,107,102,0.15)' }}
            >
              <Compass size={28} style={{ color: 'var(--color-teal)' }} />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                No destinations found
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
            <button
              onClick={() => handleFiltersChange(INITIAL_FILTERS)}
              className="btn-ghost gap-2 text-sm"
              style={{ padding: '8px 20px' }}
            >
              <X size={14} /> Clear All Filters
            </button>
          </div>
        )}

        {displayedDestinations.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {displayedDestinations.map((dest, i) => (
              <motion.div key={dest.id} variants={itemVariants}>
                <DestinationCard
                  destination={dest}
                  rank={i + 1}
                  onCompare={handleCompareToggle}
                  onViewDetails={setModalDest}
                  isInCompare={compareList.some((d) => d.id === dest.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center mt-10">
            <button
              className="btn-ghost gap-2 text-sm"
              style={{ padding: '10px 28px' }}
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading && page > 1 ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : null}
              Load More Destinations
            </button>
          </div>
        )}
      </div>

      {/* [G] Collections */}
      <div className="mt-12 mb-2">
        <CollectionsRow
          onCollectionClick={(f) => handleFiltersChange({ ...INITIAL_FILTERS, ...f })}
        />
      </div>

      {/* [H] Hidden Gems section */}
      {hiddenGems.length > 0 && (
        <div className="mt-12 py-12 px-4" style={{ background: '#1A1208' }}>
          <div className="page-container">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gem size={20} style={{ color: 'var(--color-gold)' }} />
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-gold)' }}>
                  Hidden Gems
                </p>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">
                Most Travelers Haven't Discovered These Yet
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Insider picks with spectacular experiences at a fraction of the cost
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {hiddenGems.map((dest, i) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div
                    className="rounded-2xl overflow-hidden cursor-pointer group relative"
                    style={{
                      border: '1px solid rgba(201,151,74,0.2)',
                      background: '#241A0C',
                    }}
                    onClick={() => setModalDest(dest)}
                  >
                    <div className="relative overflow-hidden" style={{ height: 160 }}>
                      <img
                        src={dest.heroImage.url}
                        alt={dest.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.src = FALLBACK_HERO_IMAGES[0]; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span
                        className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(201,151,74,0.9)', color: 'white' }}
                      >
                        Hidden Gem
                      </span>
                    </div>
                    <div className="p-3.5">
                      <p className="font-display font-bold text-sm text-white">
                        {dest.flagEmoji != null ? `${dest.flagEmoji} ` : ''}{dest.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(201,151,74,0.8)' }}>
                        {dest.country}
                      </p>
                      <p className="text-xs italic mt-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        "{dest.tagline.slice(0, 50)}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="py-10" />

      {/* [I] Destination Modal */}
      <DestinationModal
        destination={modalDest}
        onClose={() => setModalDest(null)}
        onCompare={handleCompareToggle}
        isInCompare={modalDest != null && compareList.some((d) => d.id === modalDest.id)}
      />

      {/* [J] Compare Tray */}
      <AnimatePresence>
        {compareList.length >= 1 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed bottom-6 left-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{
              transform: 'translateX(-50%)',
              background: 'rgba(17,17,24,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 40px rgba(17,17,24,0.4)',
            }}
          >
            <div className="flex gap-2">
              {compareList.map((dest) => (
                <div key={dest.id} className="relative">
                  <img
                    src={dest.heroImage.url}
                    alt={dest.name}
                    className="w-10 h-10 rounded-xl object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK_HERO_IMAGES[0]; }}
                  />
                  <button
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center"
                    style={{ fontSize: 10 }}
                    onClick={() => handleCompareToggle(dest)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {Array.from({ length: 3 - compareList.length }, (_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ border: '2px dashed rgba(255,255,255,0.2)' }}
                >
                  <span className="text-white/30 text-lg">+</span>
                </div>
              ))}
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <p className="text-xs text-white/50">{compareList.length} selected</p>
              <p className="text-xs font-semibold text-white">
                {compareList.length < 2 ? 'Add 1 more to compare' : 'Ready to compare'}
              </p>
            </div>
            <button
              className="btn-primary text-sm gap-2 disabled:opacity-40"
              style={{ padding: '8px 20px', borderRadius: 10 }}
              disabled={compareList.length < 2}
              onClick={() => setShowCompare(true)}
            >
              Compare Now →
            </button>
            <button
              className="text-white/40 hover:text-white/80 transition-colors"
              onClick={() => setCompareList([])}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* [K] Compare Modal */}
      {showCompare && compareList.length >= 2 && (
        <CompareModal
          destinations={compareList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </PageLayout>
  );
}
