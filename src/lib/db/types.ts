import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  chats,
  messages,
  files,
  customTools,
  usageMetrics,
  chatShares,
  userSettings,
  userProviders
} from './schema';

// BetterAuth manages user, session, account, and verification tables automatically
// We don't export types for these since BetterAuth provides them

export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;

export type CustomTool = InferSelectModel<typeof customTools>;
export type NewCustomTool = InferInsertModel<typeof customTools>;

export type UsageMetric = InferSelectModel<typeof usageMetrics>;
export type NewUsageMetric = InferInsertModel<typeof usageMetrics>;

export type ChatShare = InferSelectModel<typeof chatShares>;
export type NewChatShare = Omit<InferInsertModel<typeof chatShares>, 'shareToken'> & { shareToken?: string };

// Consolidated user setting types
export type UserSettings = InferSelectModel<typeof userSettings>;
export type NewUserSettings = InferInsertModel<typeof userSettings>;

export type UserProvider = InferSelectModel<typeof userProviders>;
export type NewUserProvider = InferInsertModel<typeof userProviders>;

// Legacy type aliases for backward compatibility during transition
export type UserPreferences = UserSettings;
export type NewUserPreferences = NewUserSettings;
export type UserApiKey = UserProvider;
export type NewUserApiKey = NewUserProvider;
export type UserCustomModel = {
  id: string;
  modelId: string;
  displayName: string;
  description?: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsDocument: boolean;
  costPer1kInputTokens: string;
  costPer1kOutputTokens: string;
  isActive: boolean;
  metadata: any;
  provider: ProviderType;
};
export type NewUserCustomModel = Omit<UserCustomModel, 'id'>;
export type UserProviderPreference = UserProvider;
export type NewUserProviderPreference = NewUserProvider;

// Message role enum
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// File status enum
export type FileStatus = 'uploaded' | 'processing' | 'analyzed';

// Theme enum
export type Theme = 'light' | 'dark' | 'system';

// Permission enum
export type SharePermission = 'read' | 'comment' | 'edit';

// Provider enum
export type ProviderType = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'deepseek' | 'togetherai' | 'groq' | 'mistral';

// API key validation status
export type ValidationStatus = 'pending' | 'valid' | 'invalid';

// Provider configuration with API key and models
export type ProviderConfig = {
  provider: ProviderType;
  isEnabled: boolean;
  hasApiKey: boolean;
  apiKeyValid: boolean;
  defaultModel?: string;
  availableModels: ModelConfig[];
  customModels: ModelConfig[];
};

// Model configuration
export type ModelConfig = {
  id: string;
  displayName: string;
  description?: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsDocument: boolean;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  isCustom: boolean;
};

// Chat with related data
export type ChatWithMessages = Chat & {
  messages: Message[];
};

// Note: User type is managed by BetterAuth, not defined here
export type ChatWithUser = Chat & {
  userId: string;
};

// Message with related data
export type MessageWithFiles = Message & {
  files: File[];
};

export type MessageWithChat = Message & {
  chat: Chat;
};

// Search results
export type SearchResults = {
  chats: Chat[];
  messages: MessageWithChat[];
};

// Shared chat data
export type SharedChatData = {
  share: ChatShare;
  chat: Chat;
  sharedByUserId: string;
};

// Full chat context for AI SDK
export type ChatContextWithMessages = Chat & {
  messages: (Message & { files: File[] })[];
  userId: string;
};