export type SearchResultType = 'role' | 'application' | 'emailTemplate';

export interface SearchResult {
  type: SearchResultType;
  id: number;
  title: string;
  subtitle?: string;
  // roles
  color?: string;
  isActive?: boolean;
  // applications
  roleColor?: string;
  roleName?: string;
  stageName?: string;
  stageColor?: string;
  score?: number;
}
