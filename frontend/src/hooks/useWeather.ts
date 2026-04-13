import { useQuery } from '@tanstack/react-query';
import { weatherService } from '@/services/weather.service';

export function useWeather(destination: string) {
  return useQuery({
    queryKey: ['weather', destination],
    queryFn: async () => {
      const res = await weatherService.getForecast({ destination, days: 7 });
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: destination.length > 0,
    staleTime: 1000 * 60 * 60, // 1h
  });
}
