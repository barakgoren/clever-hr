import { apiClient } from '@/lib/api';
import type { Rule, CreateRuleInput, UpdateRuleInput } from '@repo/shared';

export const ruleService = {
  async list(roleId: number): Promise<Rule[]> {
    const { data } = await apiClient.get(`/api/roles/${roleId}/rules`);
    return data.data;
  },

  async create(roleId: number, input: CreateRuleInput): Promise<Rule> {
    const { data } = await apiClient.post(`/api/roles/${roleId}/rules`, input);
    return data.data;
  },

  async update(roleId: number, id: number, input: UpdateRuleInput): Promise<Rule> {
    const { data } = await apiClient.patch(`/api/roles/${roleId}/rules/${id}`, input);
    return data.data;
  },

  async delete(roleId: number, id: number): Promise<void> {
    await apiClient.delete(`/api/roles/${roleId}/rules/${id}`);
  },
};
