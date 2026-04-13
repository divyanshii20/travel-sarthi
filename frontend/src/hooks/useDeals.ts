import { useQuery } from '@tanstack/react-query';
import { dealsService } from '@/services/deals.service';

export function useFlashDeals() {
  return useQuery({
    queryKey: ['deals', 'flash'],
    queryFn: async () => {
      const res = await dealsService.getFlashDeals();
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    refetchInterval: 1000 * 60, // refetch every minute for countdown timers
    staleTime: 0,
  });
}

export function useCoupons(params?: { category?: string; platform?: string }) {
  return useQuery({
    queryKey: ['deals', 'coupons', params],
    queryFn: async () => {
      const res = await dealsService.getCoupons(params);
      if (res.error != null) throw new Error(res.error.message);
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
