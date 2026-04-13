import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsService } from '@/services/trips.service';
import { useTripsStore } from '@/store/tripsStore';
import type { CreateTripRequestDTO, UpdateTripRequestDTO } from 'travel-sarthi-shared-types';

export function useMyTrips() {
  const setTrips = useTripsStore((s) => s.setTrips);

  return useQuery({
    queryKey: ['trips', 'mine'],
    queryFn: async () => {
      const res = await tripsService.getMyTrips();
      if (res.error != null) throw new Error(res.error.message);
      setTrips(res.data);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTripDetail(id: string) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const res = await tripsService.getTripById(id);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: id.length > 0,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTripRequestDTO) => tripsService.createTrip(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips', 'mine'] }),
  });
}

export function useUpdateTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateTripRequestDTO) => tripsService.updateTrip(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips', id] });
      qc.invalidateQueries({ queryKey: ['trips', 'mine'] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  const removeTrip = useTripsStore((s) => s.removeTripFromList);
  return useMutation({
    mutationFn: (id: string) => tripsService.deleteTrip(id),
    onSuccess: (_data, id) => {
      removeTrip(id);
      qc.invalidateQueries({ queryKey: ['trips', 'mine'] });
    },
  });
}
