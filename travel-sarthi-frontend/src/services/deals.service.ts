import { api } from './api';
import type { Coupon, FlashDeal, CouponStackResult } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const dealsService = {
  async getCoupons(params?: { category?: string; platform?: string; page?: number; limit?: number }) {
    const res = await api.get<ApiResponse<{ coupons: Coupon[]; total: number }>>('/deals/coupons', { params });
    return res.data;
  },

  async getFlashDeals() {
    const res = await api.get<ApiResponse<FlashDeal[]>>('/deals/flash');
    return res.data;
  },

  async calculateStack(body: {
    couponCodes: string[];
    baseAmount: number;
    platform?: string;
    category?: string;
  }) {
    const res = await api.post<ApiResponse<CouponStackResult>>('/deals/calculate', body);
    return res.data;
  },
};
