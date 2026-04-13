import { api } from './api';
import type { Trip, TripSummary, CreateTripRequestDTO, UpdateTripRequestDTO } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const tripsService = {
  async getMyTrips() {
    const res = await api.get<ApiResponse<TripSummary[]>>('/trips');
    return res.data;
  },

  async getTripById(id: string) {
    const res = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
    return res.data;
  },

  async createTrip(body: CreateTripRequestDTO) {
    const res = await api.post<ApiResponse<Trip>>('/trips', body);
    return res.data;
  },

  async updateTrip(id: string, body: UpdateTripRequestDTO) {
    const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}`, body);
    return res.data;
  },

  async deleteTrip(id: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(`/trips/${id}`);
    return res.data;
  },

  async shareTrip(id: string) {
    const res = await api.post<ApiResponse<{ shareToken: string; shareUrl: string }>>(`/trips/${id}/share`);
    return res.data;
  },

  async getTripByToken(shareToken: string) {
    const res = await api.get<ApiResponse<Trip>>(`/trips/shared/${shareToken}`);
    return res.data;
  },
};
