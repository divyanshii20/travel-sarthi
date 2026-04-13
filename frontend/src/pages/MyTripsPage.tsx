import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MapPin, Calendar, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useMyTrips } from '@/hooks/useTrips';
import { containerVariants, itemVariants } from '@/lib/animations';

export function MyTripsPage() {
  const { data: trips, isLoading, isError } = useMyTrips();

  return (
    <PageLayout>
      <div className="page-container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">My Trips</h1>
          <Link to="/trips/new" className="btn-primary">
            <Plus size={16} /> New Trip
          </Link>
        </div>

        {isError && (
          <div className="text-center py-16 text-secondary">Failed to load trips.</div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {trips != null && trips.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🗺️</p>
            <h2 className="text-xl font-display font-bold text-primary mb-2">No trips yet</h2>
            <p className="text-secondary mb-6">Plan your first AI-powered adventure</p>
            <Link to="/plan" className="btn-primary">Plan a Trip</Link>
          </div>
        )}

        {trips != null && trips.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {trips.map((trip) => (
              <motion.div key={trip.id} variants={itemVariants}>
                <Link to={`/trips/${trip.id}`} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-display font-bold text-primary text-lg">{trip.title}</h3>
                    <Badge variant={trip.status === 'booked' ? 'teal' : trip.status === 'in_progress' ? 'saffron' : 'muted'} size="xs">
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-secondary">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} /> {trip.destination}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
                      {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {trip.memberCount != null && trip.memberCount > 1 && (
                      <div className="flex items-center gap-2">
                        <Users size={14} /> {trip.memberCount} travelers
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
