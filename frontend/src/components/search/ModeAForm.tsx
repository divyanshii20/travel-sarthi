import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, Users } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  origin: z.string().min(3, 'Enter origin airport or city'),
  destination: z.string().min(3, 'Enter destination airport or city'),
  departDate: z.string().min(1, 'Select departure date'),
  returnDate: z.string().optional(),
  adults: z.coerce.number().min(1).max(9),
});

type FormData = z.infer<typeof schema>;

export function ModeAForm() {
  const { modeA, setModeA } = useSearchStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: modeA.origin,
      destination: modeA.destination,
      departDate: modeA.departDate,
      returnDate: modeA.returnDate,
      adults: modeA.travelers.adults,
    },
  });

  const onSubmit = (data: FormData) => {
    setModeA({
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      departDate: data.departDate,
      returnDate: data.returnDate ?? '',
      travelers: { ...modeA.travelers, adults: data.adults },
    });
    const params = new URLSearchParams({
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      departDate: data.departDate,
      adults: String(data.adults),
      ...(data.returnDate != null && data.returnDate.length > 0 ? { returnDate: data.returnDate } : {}),
    });
    navigate(`/plan/flights?${params.toString()}`);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="From"
          placeholder="DEL, Mumbai, Bangalore..."
          leftIcon={<Plane size={16} />}
          error={errors.origin?.message}
          {...register('origin')}
        />
        <Input
          label="To"
          placeholder="GOI, Goa, Jaipur..."
          leftIcon={<Plane size={16} className="rotate-90" />}
          error={errors.destination?.message}
          {...register('destination')}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Input
          label="Depart"
          type="date"
          leftIcon={<Calendar size={16} />}
          error={errors.departDate?.message}
          min={new Date().toISOString().split('T')[0]}
          {...register('departDate')}
        />
        <Input
          label="Return (optional)"
          type="date"
          leftIcon={<Calendar size={16} />}
          min={new Date().toISOString().split('T')[0]}
          {...register('returnDate')}
        />
        <Input
          label="Adults"
          type="number"
          leftIcon={<Users size={16} />}
          min={1}
          max={9}
          error={errors.adults?.message}
          {...register('adults')}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full">
        Search Flights →
      </Button>
    </form>
  );
}
