import { api } from './api';
import type {
  FlightResult,
  FarePrediction,
  FlexibleDateOption,
  FareAlert,
  PaginationMeta,
} from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  tripType?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'duration' | 'voyageScore';
  maxStops?: number;
  preferredAirlines?: string[];
}

export interface FlightSearchResponse {
  flights: FlightResult[];
  meta: PaginationMeta;
  filterOptions: {
    airlines: string[];
    stops: number[];
    priceRange: { min: number; max: number };
  };
}

export const flightsService = {
  async search(params: FlightSearchParams) {
    const res = await api.get<ApiResponse<FlightSearchResponse>>('/flights/search', { params });
    return res.data;
  },

  async predict(params: {
    origin: string;
    destination: string;
    departDate: string;
    currentPrice: number;
    travelClass?: string;
  }) {
    const res = await api.get<ApiResponse<FarePrediction & { flexibleDates?: FlexibleDateOption[] }>>(
      '/flights/predict',
      { params }
    );
    return res.data;
  },

  async getAlerts() {
    const res = await api.get<ApiResponse<FareAlert[]>>('/alerts');
    return res.data;
  },

  async createAlert(body: {
    origin: string;
    destination: string;
    targetPrice: number;
    currency: string;
    travelClass?: string;
    expiresAt?: string;
  }) {
    const res = await api.post<ApiResponse<FareAlert>>('/alerts', body);
    return res.data;
  },

  async deleteAlert(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/alerts/${id}`);
    return res.data;
  },

  async toggleAlert(id: string) {
    const res = await api.patch<ApiResponse<FareAlert>>(`/alerts/${id}/toggle`);
    return res.data;
  },
};
