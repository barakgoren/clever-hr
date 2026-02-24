export interface Company {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPublic {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
}
