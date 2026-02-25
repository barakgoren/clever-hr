import type { Stage } from './stage';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'file'
  | 'checkbox'
  | 'select';

export type RoleType = 'full_time' | 'part_time' | 'hybrid' | 'remote';

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  system?: boolean;
}

export interface Role {
  id: number;
  companyId: number;
  createdByUserId: number;
  name: string;
  description: string | null;
  location: string | null;
  type: RoleType;
  seniorityLevel: string | null;
  requirements: string[];
  isActive: boolean;
  customFields: CustomField[];
  stages?: Stage[];
  createdAt: string;
  updatedAt: string;
}
