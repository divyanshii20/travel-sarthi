import { api } from './api';
import type { DisruptionEvent } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const disruptionService = {
  async getFlightDisruptions(flightNumber: string, date: string) {
    const res = await api.get<ApiResponse<DisruptionEvent[]>>('/disruption', {
      params: { flightNumber, date },
    });
    return res.data;
  },
};
