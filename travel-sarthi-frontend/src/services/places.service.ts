import { api } from './api';
import type { Place } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const placesService = {
  async search(params: {
    lat?: number;
    lng?: number;
    query?: string;
    type?: string;
    radius?: number;
    destination?: string;
  }) {
    const res = await api.get<ApiResponse<Place[]>>('/places/search', { params });
    return res.data;
  },
};
