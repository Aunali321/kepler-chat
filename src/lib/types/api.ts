import type { Chat, Message, User, UserProvider } from '@/lib/db/types';

// Base API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
  statusCode?: number;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Pagination interface
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Specific response types for each endpoint
export interface ChatResponse extends ApiResponse<Chat> {}
export interface ChatsResponse extends ApiResponse<Chat[]> {}
export interface PaginatedChatsResponse extends PaginatedResponse<Chat> {}

export interface MessageResponse extends ApiResponse<Message> {}
export interface MessagesResponse extends ApiResponse<Message[]> {}

export interface UserResponse extends ApiResponse<User> {}
export interface UserProfileResponse extends ApiResponse<Partial<User>> {}

export interface ProviderResponse extends ApiResponse<UserProvider> {}
export interface ProvidersResponse extends ApiResponse<UserProvider[]> {}

export interface ApiKeyResponse extends ApiResponse<{
  id: string;
  provider: string;
  isActive: boolean;
  lastValidated: Date | null;
  createdAt: Date;
  updatedAt: Date;
  hasApiKey: boolean;
  maskedApiKey: string | null;
}> {}

export interface ApiKeysResponse extends ApiResponse<ApiKeyResponse['data'][]> {}

export interface CustomModelResponse extends ApiResponse<{
  id: string;
  modelId: string;
  displayName: string;
  description?: string;
  provider: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsDocument: boolean;
  costPer1kInputTokens: string;
  costPer1kOutputTokens: string;
  isActive: boolean;
  metadata: Record<string, any>;
}> {}

export interface CustomModelsResponse extends ApiResponse<CustomModelResponse['data'][]> {}

export interface FileUploadResponse extends ApiResponse<{
  uploadUrl: string;
  fileKey: string;
  filename: string;
  contentType: string;
  size: number;
}> {}

export interface FileResponse extends ApiResponse<{
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  chatId?: string;
  createdAt: Date;
  updatedAt: Date;
}> {}

export interface FilesResponse extends ApiResponse<FileResponse['data'][]> {}

export interface ChatSearchResponse extends ApiResponse<{
  chats: Chat[];
  messages: Message[];
  totalResults: number;
}> {}

export interface ChatExportResponse extends ApiResponse<{
  exportUrl: string;
  format: 'json' | 'markdown' | 'txt';
  filename: string;
  size: number;
}> {}

export interface ChatShareResponse extends ApiResponse<{
  shareToken: string;
  shareUrl: string;
  isPublic: boolean;
  expiresAt?: Date;
}> {}

export interface SharedChatResponse extends ApiResponse<{
  chat: Chat;
  messages: Message[];
  isPublic: boolean;
  expiresAt?: Date;
}> {}

// User preferences response
export interface UserPreferencesResponse extends ApiResponse<{
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultProvider?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
  streamResponses: boolean;
  showTokenCount: boolean;
  autoSave: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}> {}

// Validation response
export interface ValidationResponse extends ApiResponse<{
  isValid: boolean;
  provider: string;
  model?: string;
  error?: string;
}> {}

// Streaming response type
export interface StreamingResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason?: 'stop' | 'length' | 'content_filter' | null;
  }>;
}