import { useQuery } from '@tanstack/react-query';
import { discoveryService } from '@/services/discovery.service';
import type { DiscoverRequestDTO } from 'travel-sarthi-shared-types';

export function useDestinations(params?: DiscoverRequestDTO & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn: async () => {
      const res = await discoveryService.getDestinations(params);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useDestination(slug: string) {
  return useQuery({
    queryKey: ['destinations', slug],
    queryFn: async () => {
      const res = await discoveryService.getDestinationBySlug(slug);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    enabled: slug.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}
