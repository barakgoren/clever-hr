export interface Application {
  id: number;
  roleId: number;
  companyId: number;
  currentStageId: number | null;
  formData: Record<string, string | boolean>;
  resumeS3Key: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationWithRelations extends Application {
  role: {
    id: number;
    name: string;
  };
  currentStage: {
    id: number;
    name: string;
  } | null;
}
