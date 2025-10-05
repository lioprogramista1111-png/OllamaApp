export interface OllamaModel {
  name: string;
  displayName: string;
  description: string;
  size: number;
  modifiedAt: Date;
  digest: string;
  capabilities: ModelCapabilities;
  status: ModelStatus;
  performance?: ModelPerformanceMetrics;
}

export interface ModelCapabilities {
  codeAnalysis: boolean;
  codeGeneration: boolean;
  documentation: boolean;
  chat: boolean;
  debugging: boolean;
  codeReview: boolean;
  supportedLanguages: string[];
  maxTokens: number;
  optimalUseCase: string;
}

export interface ModelPerformanceMetrics {
  averageResponseTime: number;
  tokensPerSecond: number;
  totalRequests: number;
  lastUsed: Date;
  memoryUsage: number;
  cpuUsage: number;
}

export enum ModelStatus {
  Available = 'Available',
  Loading = 'Loading',
  Running = 'Running',
  Error = 'Error',
  NotInstalled = 'NotInstalled'
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: OllamaOptions;
}

export interface OllamaOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  numCtx?: number;
  numPredict?: number;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  createdAt: Date;
  totalDuration: number;
  loadDuration: number;
  promptEvalCount: number;
  promptEvalDuration: number;
  evalCount: number;
  evalDuration: number;
}

export interface ModelSwitchRequest {
  modelName: string;
  userId: string;
  sessionId: string;
}

export interface ModelSwitchResponse {
  success: boolean;
  message: string;
  model?: OllamaModel;
  switchDuration: number;
}

// Registry and Download Models
export interface OllamaRegistryModel {
  name: string;
  displayName: string;
  description: string;
  shortDescription: string;
  tags: string[];
  size: number;
  downloads: number;
  updatedAt: string;
  category: string;
  languages: string[];
  capabilities: ModelCapabilities;
  license: string;
  publisher: string;
  isOfficial: boolean;
  variants: string[];
  metadata: { [key: string]: any };
}

export interface ModelDownloadProgress {
  modelName: string;
  status: string;
  bytesDownloaded: number;
  totalBytes: number;
  progressPercentage: number;
  elapsedTime: string;
  estimatedTimeRemaining: string;
  downloadSpeed: number;
  startTime: string;
  completedTime?: string;
  errorMessage?: string;
  isCompleted: boolean;
  hasError: boolean;
}

export interface ModelDownloadRequest {
  modelName: string;
  tag?: string;
  userId: string;
  sessionId: string;
  autoStart?: boolean;
}

export interface ModelDownloadResponse {
  success: boolean;
  message: string;
  downloadId?: string;
  progress?: ModelDownloadProgress;
}

export interface ModelRegistrySearchRequest {
  query?: string;
  category?: string;
  languages?: string[];
  capabilities?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
  maxSize?: number;
  officialOnly?: boolean;
}

export interface ModelRegistrySearchResponse {
  models: OllamaRegistryModel[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ModelHubEvent {
  type: 'ModelSwitched' | 'ModelPullProgress' | 'ModelPullCompleted' | 'ModelRemoved' | 'ModelPreloaded' | 'ModelPerformanceUpdate' | 'ModelStatusChanged';
  data: any;
  timestamp: Date;
}

export interface ModelRecommendation {
  taskType: string;
  recommendedModels: string[];
  description: string;
}

export interface ModelComparison {
  models: { [modelName: string]: ModelPerformanceMetrics };
  bestPerforming: {
    fastest: string;
    mostEfficient: string;
    mostUsed: string;
  };
}

export interface ModelFilter {
  capabilities?: string[];
  status?: ModelStatus[];
  minPerformance?: number;
  supportedLanguages?: string[];
  searchTerm?: string;
}

export interface ModelSortOption {
  field: 'name' | 'size' | 'performance' | 'lastUsed';
  direction: 'asc' | 'desc';
}

export interface ModelInstallProgress {
  modelName: string;
  progress: number;
  status: string;
  estimatedTimeRemaining?: number;
}

export interface ModelConfiguration {
  modelName: string;
  options: OllamaOptions;
  customPrompts?: { [key: string]: string };
  preferences: {
    autoSwitch: boolean;
    preloadOnStart: boolean;
    maxConcurrentRequests: number;
  };
}
