import { apiClient } from '@/lib/api';
import type { SearchResult } from '@repo/shared';

export const searchService = {
  async search(q: string): Promise<SearchResult[]> {
    const { data } = await apiClient.get('/api/search', { params: { q } });
    return data.data;
  },
};
