// Types
export type { Company, CompanyPublic } from './types/company';
export type { User, UserRole } from './types/user';
export type { Role, CustomField, FieldType, RoleType } from './types/role';
export type { Stage } from './types/stage';
export type { Application, ApplicationWithRelations, ApplicationTimelineEntry } from './types/application';

// Schemas
export { updateCompanySchema } from './schemas/company';
export type { UpdateCompanyInput } from './schemas/company';

export { createUserSchema, updateUserSchema, loginSchema } from './schemas/user';
export type { CreateUserInput, UpdateUserInput, LoginInput } from './schemas/user';

export { createRoleSchema, updateRoleSchema } from './schemas/role';
export type { CreateRoleInput, UpdateRoleInput } from './schemas/role';

export { submitApplicationSchema, moveApplicationStageSchema, addApplicationTimelineSchema } from './schemas/application';
export type { SubmitApplicationInput, MoveApplicationStageInput, AddApplicationTimelineInput } from './schemas/application';

export { sendEmailSchema, createEmailTemplateSchema, updateEmailTemplateSchema } from './schemas/email';
export type { SendEmailInput, CreateEmailTemplateInput, UpdateEmailTemplateInput } from './schemas/email';

// Legacy (keep ApiResponse for backwards compat)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
