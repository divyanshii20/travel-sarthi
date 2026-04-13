import { motion } from 'framer-motion';
import { CloudSun, MapPin } from 'lucide-react';
import type { ItineraryDay, Activity } from 'travel-sarthi-shared-types';
import { ActivityCard } from './ActivityCard';
import { containerVariants, itemVariants } from '@/lib/animations';

interface DaySlideProps {
  day: ItineraryDay;
  destination: string;
  onStatusChange?: (activityId: string, status: 'done' | 'skipped' | 'pending') => void;
  onSwap?: (activityId: string) => void;
}

export function DaySlide({ day, destination, onStatusChange, onSwap }: DaySlideProps) {
  return (
    <motion.div
      key={day.dayNumber}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Hero image */}
      <div className="relative h-44 rounded-2xl overflow-hidden">
        <img
          src={day.heroImage.url}
          alt={`Day ${day.dayNumber}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="font-display font-bold text-xl">Day {day.dayNumber}</p>
          <p className="text-sm text-white/80 font-semibold">{day.city}</p>
        </div>
        {day.weather != null && (
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2 text-white text-sm">
            <CloudSun size={16} />
            <span>{day.weather.condition}</span>
            <span className="font-bold">{day.weather.tempMax}°C</span>
          </div>
        )}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/80 text-xs">
          <MapPin size={12} />
          {destination}
        </div>
      </div>

      {/* Activities */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        {day.activities.map((activity: Activity) => (
          <motion.div key={activity.id} variants={itemVariants}>
            <ActivityCard
              activity={activity}
              {...(onStatusChange !== undefined ? { onStatusChange } : {})}
              {...(onSwap !== undefined ? { onSwap } : {})}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
