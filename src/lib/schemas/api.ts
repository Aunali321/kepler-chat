import { z } from 'zod';

// Common field schemas
export const uuidSchema = z.string().uuid();
export const providerSchema = z.enum([
  'openai',
  'anthropic', 
  'google',
  'openrouter',
  'deepseek',
  'togetherai',
  'groq',
  'mistral'
]);

// API Key Management schemas
export const apiKeySchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(1, 'API key is required'),
  metadata: z.record(z.any()).optional(),
});

export const apiKeyQuerySchema = z.object({
  provider: providerSchema.optional(),
});

export const apiKeyDeleteSchema = z.object({
  provider: providerSchema,
});

// Chat schemas
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content is required'),
  metadata: z.record(z.any()).optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
  chatId: uuidSchema.optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
});

export const chatSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().positive().max(100).optional().default(20),
  offset: z.number().nonnegative().optional().default(0),
});

export const chatExportSchema = z.object({
  chatIds: z.array(uuidSchema).min(1, 'At least one chat ID is required'),
  format: z.enum(['json', 'markdown', 'txt']).optional().default('json'),
});

export const chatShareSchema = z.object({
  chatId: uuidSchema,
  isPublic: z.boolean().default(true),
});

// File Upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().positive('File size must be positive'),
  chatId: uuidSchema.optional(),
});

export const fileConfirmSchema = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  originalFilename: z.string().min(1, 'Original filename is required'),
  chatId: uuidSchema.optional(),
});

export const fileActionSchema = z.object({
  action: z.enum(['upload-url', 'confirm-upload']),
  filename: z.string().min(1).max(255).optional(),
  contentType: z.string().optional(),
  size: z.number().positive().optional(),
  fileKey: z.string().optional(),
  chatId: uuidSchema.optional(),
});

// Custom Model schemas
export const customModelSchema = z.object({
  provider: providerSchema,
  modelId: z.string().min(1, 'Model ID is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  maxTokens: z.number().positive().optional().default(4096),
  supportsVision: z.boolean().optional().default(false),
  supportsTools: z.boolean().optional().default(false),
  supportsAudio: z.boolean().optional().default(false),
  supportsVideo: z.boolean().optional().default(false),
  supportsDocument: z.boolean().optional().default(false),
  costPer1kInputTokens: z.string().optional().default('0'),
  costPer1kOutputTokens: z.string().optional().default('0'),
  metadata: z.record(z.any()).optional(),
});

export const customModelUpdateSchema = z.object({
  id: uuidSchema,
  provider: providerSchema,
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  supportsVision: z.boolean().optional(),
  supportsTools: z.boolean().optional(),
  supportsAudio: z.boolean().optional(),
  supportsVideo: z.boolean().optional(),
  supportsDocument: z.boolean().optional(),
  costPer1kInputTokens: z.string().optional(),
  costPer1kOutputTokens: z.string().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const customModelQuerySchema = z.object({
  provider: providerSchema.optional(),
});

export const customModelDeleteSchema = z.object({
  id: uuidSchema,
  provider: providerSchema,
});

// User Preferences schemas
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  defaultProvider: providerSchema.optional(),
  defaultModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  streamResponses: z.boolean().optional(),
  showTokenCount: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    desktop: z.boolean().optional(),
  }).optional(),
});

// Provider Configuration schemas
export const providerConfigSchema = z.object({
  provider: providerSchema,
  settings: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional().default(true),
  models: z.array(z.string()).optional(),
  customModels: z.array(z.any()).optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Generic ID parameter schema
export const idParamSchema = z.object({
  id: uuidSchema,
});

export const fileIdParamSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
});

export const tokenParamSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Resource action schemas for consolidated routes
export const userResourceSchema = z.object({
  resource: z.enum(['preferences', 'api-keys', 'models', 'profile']).optional(),
});

// Shared chat schemas (simplified)
export const sharedChatAccessSchema = z.object({
  // No password support for simplified sharing
});