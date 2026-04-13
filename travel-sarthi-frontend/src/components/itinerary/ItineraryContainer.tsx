import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import type { Itinerary, ItineraryDay } from 'travel-sarthi-shared-types';
import { DaySlide } from './DaySlide';
import { Button } from '@/components/ui/Button';
import { itineraryService } from '@/services/itinerary.service';
import { useToast } from '@/hooks/useToast';

interface ItineraryContainerProps {
  itinerary: Itinerary;
}

export function ItineraryContainer({ itinerary }: ItineraryContainerProps) {
  const [activeDay, setActiveDay] = useState(1);
  const { success, error: toastError } = useToast();

  const handleExport = async (format: 'pdf' | 'ical') => {
    try {
      const blob = await itineraryService.export(itinerary.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itinerary-${itinerary.id}.${format === 'pdf' ? 'pdf' : 'ics'}`;
      a.click();
      URL.revokeObjectURL(url);
      success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toastError('Export failed. Please try again.');
    }
  };

  const currentDay = itinerary.days.find((d: ItineraryDay) => d.dayNumber === activeDay);

  return (
    <div className="flex flex-col gap-6">
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {itinerary.days.map((day: ItineraryDay) => (
          <button
            key={day.dayNumber}
            onClick={() => setActiveDay(day.dayNumber)}
            className="relative shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              color: activeDay === day.dayNumber ? 'white' : 'var(--text-secondary)',
              background: activeDay === day.dayNumber ? 'transparent' : 'var(--bg-card)',
            }}
          >
            {activeDay === day.dayNumber && (
              <motion.div
                layoutId="day-tab-bg"
                className="absolute inset-0 rounded-xl bg-saffron"
                style={{ zIndex: -1 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            )}
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Day slide */}
      <AnimatePresence mode="wait">
        {currentDay != null && (
          <DaySlide
            key={activeDay}
            day={currentDay}
            destination={itinerary.destination}
          />
        )}
      </AnimatePresence>

      {/* Export buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Download size={15} />}
          onClick={() => void handleExport('pdf')}
        >
          Export PDF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Download size={15} />}
          onClick={() => void handleExport('ical')}
        >
          Export iCal
        </Button>
      </div>
    </div>
  );
}
