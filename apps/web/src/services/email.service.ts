import { apiClient } from '@/lib/api';

export interface EmailTemplate {
  id: number;
  companyId: number;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const emailService = {
  async listTemplates(): Promise<EmailTemplate[]> {
    const { data } = await apiClient.get('/api/email-templates');
    return data.data;
  },

  async getTemplate(id: number): Promise<EmailTemplate> {
    const { data } = await apiClient.get(`/api/email-templates/${id}`);
    return data.data;
  },

  async createTemplate(payload: { name: string; subject: string; body: string }): Promise<EmailTemplate> {
    const { data } = await apiClient.post('/api/email-templates', payload);
    return data.data;
  },

  async updateTemplate(id: number, payload: Partial<{ name: string; subject: string; body: string }>): Promise<EmailTemplate> {
    const { data } = await apiClient.patch(`/api/email-templates/${id}`, payload);
    return data.data;
  },

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`/api/email-templates/${id}`);
  },

  async sendToApplicant(applicationId: number, payload: { to: string; subject: string; body: string; templateId?: number }): Promise<void> {
    await apiClient.post(`/api/applications/${applicationId}/email`, payload);
  },
};
