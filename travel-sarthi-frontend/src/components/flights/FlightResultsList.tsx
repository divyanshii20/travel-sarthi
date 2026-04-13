import { motion } from 'framer-motion';
import type { FlightResult } from 'travel-sarthi-shared-types';
import { FlightCard } from './FlightCard';
import { FlightCardSkeleton } from './FlightCardSkeleton';
import { containerVariants, itemVariants } from '@/lib/animations';

interface FlightResultsListProps {
  flights: FlightResult[];
  isLoading: boolean;
  isError: boolean;
}

export function FlightResultsList({ flights, isLoading, isError }: FlightResultsListProps) {
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl mb-2">✈️</p>
        <p className="font-semibold text-primary">Could not fetch flights</p>
        <p className="text-sm text-muted mt-1">Please check your connection and try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <FlightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-semibold text-primary">No flights found</p>
        <p className="text-sm text-muted mt-1">Try adjusting your dates or filters.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3"
    >
      {flights.map((flight) => (
        <motion.div key={flight.id} variants={itemVariants}>
          <FlightCard flight={flight} />
        </motion.div>
      ))}
    </motion.div>
  );
}
