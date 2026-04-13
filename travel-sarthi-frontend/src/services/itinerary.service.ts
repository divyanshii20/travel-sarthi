import { api } from './api';
import type { Itinerary, GenerateItineraryRequestDTO, SwapActivityRequestDTO } from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };

export const itineraryService = {
  async generate(body: GenerateItineraryRequestDTO) {
    const res = await api.post<ApiResponse<Itinerary>>('/itinerary/generate', body);
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Itinerary>>(`/itinerary/${id}`);
    return res.data;
  },

  async updateActivityStatus(itineraryId: string, activityId: string, status: string) {
    const res = await api.patch<ApiResponse<Itinerary>>(
      `/itinerary/${itineraryId}/activities/${activityId}`,
      { status }
    );
    return res.data;
  },

  async swapActivity(itineraryId: string, body: SwapActivityRequestDTO) {
    const res = await api.post<ApiResponse<Itinerary>>(`/itinerary/${itineraryId}/swap-activity`, body);
    return res.data;
  },

  async export(itineraryId: string, format: 'pdf' | 'ical') {
    const res = await api.post<Blob>(`/itinerary/${itineraryId}/export`, { format }, { responseType: 'blob' });
    return res.data;
  },
};
