import { api } from './api';
import type { Hotel, HotelSearchRequestDTO, PaginationMeta } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export interface HotelSearchResponse {
  hotels: Hotel[];
  meta: PaginationMeta;
}

export const hotelsService = {
  async search(params: HotelSearchRequestDTO) {
    const res = await api.get<ApiResponse<HotelSearchResponse>>('/hotels/search', { params });
    return res.data;
  },
};
