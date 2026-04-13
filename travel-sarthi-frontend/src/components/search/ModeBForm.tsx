import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { MapPin, IndianRupee, Calendar } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const MOODS = ['Adventure', 'Culture', 'Beach', 'Mountains', 'Wildlife', 'Spiritual', 'Food', 'Relaxation'];

const schema = z.object({
  origin: z.string().min(3, 'Enter your departure city'),
  budget: z.coerce.number().min(5000, 'Min budget is ₹5,000').max(500000),
  durationDays: z.coerce.number().min(1).max(30),
  travelMood: z.string().min(1, 'Select a travel mood'),
});

type FormData = z.infer<typeof schema>;

export function ModeBForm() {
  const { modeB, setModeB } = useSearchStore();
  const navigate = useNavigate();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: modeB.origin,
      budget: modeB.budget,
      durationDays: modeB.durationDays,
      travelMood: modeB.travelMood,
    },
  });

  const onSubmit = (data: FormData) => {
    setModeB({ ...data });
    const params = new URLSearchParams({
      origin: data.origin,
      budget: String(data.budget),
      durationDays: String(data.durationDays),
      travelMood: data.travelMood,
    });
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Flying from"
          placeholder="Delhi, Mumbai, Bangalore..."
          leftIcon={<MapPin size={16} />}
          error={errors.origin?.message}
          {...register('origin')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-primary">Budget (₹)</label>
          <div className="relative">
            <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="range"
              min={5000}
              max={200000}
              step={1000}
              className="w-full mt-2"
              {...register('budget')}
            />
          </div>
          <p className="text-xs text-muted">₹{modeB.budget.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Duration (days)"
          type="number"
          leftIcon={<Calendar size={16} />}
          min={1}
          max={30}
          error={errors.durationDays?.message}
          {...register('durationDays')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-primary">Travel Mood</label>
          <Controller
            name="travelMood"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => field.onChange(mood)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      field.value === mood
                        ? 'bg-saffron text-white border-saffron'
                        : 'bg-card text-secondary border-card hover:border-saffron'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.travelMood != null && (
            <p className="text-xs text-red-500">{errors.travelMood.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" variant="secondary" size="lg" className="w-full">
        Discover Best Destinations →
      </Button>
    </form>
  );
}
