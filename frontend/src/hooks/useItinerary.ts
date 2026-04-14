import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itineraryService } from '@/services/itinerary.service';
import type { GenerateItineraryRequestDTO } from 'travel-sarthi-shared-types';

export function useItinerary(id: string) {
  return useQuery({
    queryKey: ['itinerary', id],
    queryFn: async () => {
      const res = await itineraryService.getById(id);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: id.length > 0,
    staleTime: 1000 * 60 * 60, // 1h — itineraries rarely change
  });
}

export function useGenerateItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateItineraryRequestDTO) => itineraryService.generate(body),
    onSuccess: (res) => {
      if (res.data?.itinerary != null) {
        qc.setQueryData(['itinerary', res.data.itinerary.id], res.data.itinerary);
      }
    },
  });
}
