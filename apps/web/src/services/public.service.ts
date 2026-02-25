import axios from "axios";
import type { Role } from "@repo/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const publicClient = axios.create({ baseURL: API_URL });

interface CompanyPublicData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  roles: Role[];
}

export const publicService = {
  async getCompany(
    slug: string,
  ): Promise<{ company: CompanyPublicData; roles: Role[] }> {
    const { data } = await publicClient.get(`/api/public/${slug}`);
    return data.data;
  },

  async getRole(slug: string, roleId: number): Promise<Role> {
    const { data } = await publicClient.get(
      `/api/public/${slug}/roles/${roleId}`,
    );
    return data.data;
  },

  async submitApplication(
    slug: string,
    roleId: number,
    formData: FormData,
  ): Promise<void> {
    await publicClient.post(
      `/api/public/${slug}/roles/${roleId}/apply`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
  },
};
