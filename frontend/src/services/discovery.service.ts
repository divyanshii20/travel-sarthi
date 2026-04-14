import { api } from './api';
import type {
  Destination,
  DiscoverRequestDTO,
  CompareDestinationsResponseDTO,
  PaginationMeta,
} from 'travel-sarthi-shared-types';

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } };
type PaginatedApiResponse<T> = { data: T; error: null; meta: PaginationMeta } | { data: null; error: { code: string; message: string } };

export const discoveryService = {
  async getDestinations(params?: DiscoverRequestDTO & { page?: number; limit?: number }) {
    const res = await api.get<PaginatedApiResponse<{ destinations: Destination[]; totalResults: number; featured: Destination[]; trending: Destination[]; hiddenGems: Destination[] }>>(
      '/discovery/destinations',
      { params }
    );
    return res.data;
  },

  async getDestinationBySlug(slug: string) {
    const res = await api.get<ApiResponse<Destination>>(`/discovery/destinations/${slug}`);
    return res.data;
  },

  async compare(slugs: string[]) {
    const res = await api.post<ApiResponse<CompareDestinationsResponseDTO>>('/discovery/compare', { slugs });
    return res.data;
  },

  async aiSearch(query: string) {
    const res = await api.post<PaginatedApiResponse<{ destinations: Destination[]; query: string; filters: Record<string, unknown> }>>('/discovery/ai-search', { query });
    return res.data;
  },
};
