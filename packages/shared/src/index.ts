export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
