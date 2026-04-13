import { api } from './api';
import type { WeatherForecast } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const weatherService = {
  async getForecast(params: { destination?: string; lat?: number; lng?: number; days?: number }) {
    const res = await api.get<ApiResponse<WeatherForecast>>('/weather', { params });
    return res.data;
  },
};
