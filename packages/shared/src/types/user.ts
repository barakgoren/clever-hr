export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  companyId: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
