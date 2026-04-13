import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';
import { containerVariants, itemVariants, scrollReveal } from '@/lib/animations';
import { useDestinations } from '@/hooks/useDestinations';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { getDestinationImage } from '@/constants/cdnImages';

export function DestinationGrid() {
  const { data, isLoading, isError } = useDestinations({ limit: 8 });

  return (
    <section className="section">
      <div className="page-container">
        <motion.div {...scrollReveal} className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-primary mb-2">
            Top Destinations for Indian Travelers
          </h2>
          <p className="text-secondary">Curated picks with real-time pricing and AI-powered insights</p>
        </motion.div>

        {isError && (
          <div className="text-center py-10 text-secondary">
            Failed to load destinations. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {data != null && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {data.destinations.map((dest) => (
              <motion.div key={dest.id} variants={itemVariants}>
                <Link to={`/discover/${dest.slug}`} className="group block card overflow-hidden">
                  <div className="relative h-36 sm:h-44 overflow-hidden">
                    <img
                      src={dest.heroImage.url ?? getDestinationImage(dest.slug)}
                      alt={dest.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-display font-bold text-sm">{dest.name}</p>
                      <div className="flex items-center gap-1 text-white/80 text-[10px]">
                        <MapPin size={10} />
                        {dest.country}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted">From</p>
                      <p className="text-sm font-bold text-primary">
                        ₹{dest.budget.budget.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <TrendingUp size={12} />
                      {dest.score.affordability}/10
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="text-center mt-8">
          <Link to="/discover" className="btn-ghost">
            View All Destinations →
          </Link>
        </div>
      </div>
    </section>
  );
}
