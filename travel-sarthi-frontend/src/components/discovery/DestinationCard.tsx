import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Shield, Sun, Plane } from 'lucide-react';
import type { Destination } from 'travel-sarthi-shared-types';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface DestinationCardProps {
  destination: Destination;
  rank?: number;
}

export function DestinationCard({ destination: dest, rank }: DestinationCardProps) {
  return (
    <motion.div
      className="card overflow-hidden group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      {/* Hero image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={dest.heroImage.url}
          alt={dest.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />

        {rank != null && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-saffron text-white text-xs font-display font-bold flex items-center justify-center">
            #{rank}
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-display font-bold text-lg leading-tight">{dest.name}</p>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin size={10} />
                {dest.country}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={dest.visa.type === 'visa_free' ? 'green' : 'coral'} size="xs">
                {dest.visa.type === 'visa_free' ? 'Visa Free' : 'Visa Required'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-3">
        <p className="text-xs text-secondary italic">"{dest.tagline}"</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted mb-1">
              <Shield size={10} /> Safety
            </div>
            <ProgressBar value={(dest.score.safety / 10) * 100} color="bg-teal" height={4} />
            <p className="text-xs font-semibold text-primary mt-0.5">{dest.score.safety}/10</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted mb-1">
              <Sun size={10} /> Weather
            </div>
            <ProgressBar value={(dest.score.weatherScore / 10) * 100} color="bg-gold" height={4} />
            <p className="text-xs font-semibold text-primary mt-0.5">{dest.score.weatherScore}/10</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Budget from</p>
            <p className="text-base font-display font-bold text-primary">
              ₹{dest.budget.budget.amount.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-muted"> /person/day</span>
            </p>
          </div>
          <Link to={`/discover/${dest.slug}`} className="btn-primary px-4 py-2 text-sm">
            <Plane size={14} /> Plan Trip
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
