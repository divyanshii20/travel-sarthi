import { useQuery } from '@tanstack/react-query';
import { flightsService, type FlightSearchParams } from '@/services/flights.service';

export function useFlightSearch(params: FlightSearchParams, enabled = true) {
  return useQuery({
    queryKey: ['flights', 'search', params],
    queryFn: async () => {
      const res = await flightsService.search(params);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: enabled && params.origin.length > 0 && params.destination.length > 0 && params.departDate.length > 0,
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });
}

export function useFarePrediction(
  params: { origin: string; destination: string; departDate: string; currentPrice: number },
  enabled = true
) {
  return useQuery({
    queryKey: ['flights', 'predict', params],
    queryFn: async () => {
      const res = await flightsService.predict(params);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: enabled && params.origin.length > 0 && params.destination.length > 0,
    staleTime: 1000 * 60 * 15, // 15 min
  });
}
