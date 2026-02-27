import { apiClient } from '@/lib/api';
import type { Company, CompanyUsage, UpdateCompanyInput } from '@repo/shared';

export const companyService = {
  async get(): Promise<Company> {
    const { data } = await apiClient.get('/api/company');
    return data.data;
  },

  async update(input: UpdateCompanyInput): Promise<Company> {
    const { data } = await apiClient.patch('/api/company', input);
    return data.data;
  },

  async uploadLogo(file: File): Promise<Company> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/api/company/logo', form);
    return data.data;
  },

  async uploadHero(file: File): Promise<Company> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/api/company/hero', form);
    return data.data;
  },

  async getUsage(): Promise<CompanyUsage> {
    const { data } = await apiClient.get('/api/company/usage');
    return data.data;
  },
};
