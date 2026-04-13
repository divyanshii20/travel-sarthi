import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowRight, CheckCircle, Shuffle, Lightbulb } from 'lucide-react';
import type { Activity } from 'travel-sarthi-shared-types';
import { Badge } from '@/components/ui/Badge';

interface ActivityCardProps {
  activity: Activity;
  onStatusChange?: (activityId: string, status: 'done' | 'skipped' | 'pending') => void;
  onSwap?: (activityId: string) => void;
}

export function ActivityCard({ activity, onStatusChange, onSwap }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = activity.isCompleted;
  const isSkipped = activity.isSkipped;

  return (
    <motion.div
      className={`card p-0 overflow-hidden transition-opacity ${isSkipped ? 'opacity-50' : ''}`}
      layout
    >
      <div className="flex gap-0">
        {/* Time badge sidebar */}
        <div className="flex flex-col items-center gap-1 px-3 py-4 bg-card border-r border-card min-w-[60px]">
          <Clock size={12} className="text-muted" />
          <p className="text-xs font-bold text-primary text-center leading-tight">{activity.startTime}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className={`text-sm font-bold text-primary ${isDone ? 'line-through opacity-60' : ''}`}>
                  {activity.title}
                </h4>
                {isDone && <CheckCircle size={14} className="text-green-500" />}
                <Badge variant="teal" size="xs">{activity.category}</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <MapPin size={10} />
                {activity.location.name}
              </div>
            </div>

            {/* Thumbnail */}
            {activity.image != null && (
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <img
                  src={activity.image.url}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Duration + cost */}
          <div className="flex items-center gap-3 mt-2 text-xs text-secondary">
            <span>{activity.duration} min</span>
            <span>₹{activity.estimatedCost.amount.toLocaleString('en-IN')}</span>
          </div>

          {/* Local tip */}
          {activity.localTip != null && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
            >
              <Lightbulb size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-secondary">{activity.localTip}</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {(activity.localTip != null || activity.description.length > 0) && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-teal font-semibold hover:underline"
              >
                {expanded ? 'Less' : 'Details'}
              </button>
            )}
            <a
              href={activity.location.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-secondary hover:text-primary flex items-center gap-1"
            >
              Maps <ArrowRight size={10} />
            </a>
            {onSwap != null && (
              <button
                onClick={() => onSwap(activity.id)}
                className="ml-auto text-xs text-muted hover:text-primary flex items-center gap-1"
              >
                <Shuffle size={12} /> Swap
              </button>
            )}
            {onStatusChange != null && (
              <button
                onClick={() => onStatusChange(activity.id, isDone ? 'pending' : 'done')}
                className={`text-xs font-semibold flex items-center gap-1 ${isDone ? 'text-muted' : 'text-green-600'}`}
              >
                {isDone ? 'Undo' : <><CheckCircle size={12} /> Done</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
