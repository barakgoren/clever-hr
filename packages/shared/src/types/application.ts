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

export interface ApplicationTimelineEntry {
  id: number;
  applicationId: number;
  companyId: number;
  stageId: number | null;
  stageName: string;
  description: string | null;
  createdAt: string;
}

export interface ApplicationWithRelations extends Application {
  role: {
    id: number;
    name: string;
    color: string;
  };
  currentStage: {
    id: number;
    name: string;
    color: string;
    icon: string;
  } | null;
  timeline?: ApplicationTimelineEntry[];
}
