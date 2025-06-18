import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  users,
  chats,
  messages,
  files,
  customTools,
  usageMetrics,
  sessions,
  chatFolders,
  chatTags,
  chatTagRelations,
  chatShares,
  userPreferences,
  userApiKeys,
  userCustomModels,
  userProviderPreferences
} from './schema';

// Infer types from Drizzle schema
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

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

export type ChatFolder = InferSelectModel<typeof chatFolders>;
export type NewChatFolder = InferInsertModel<typeof chatFolders>;

export type ChatTag = InferSelectModel<typeof chatTags>;
export type NewChatTag = InferInsertModel<typeof chatTags>;

export type ChatTagRelation = InferSelectModel<typeof chatTagRelations>;
export type NewChatTagRelation = InferInsertModel<typeof chatTagRelations>;

export type ChatShare = InferSelectModel<typeof chatShares>;
export type NewChatShare = Omit<InferInsertModel<typeof chatShares>, 'shareToken'> & { shareToken?: string };

export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;

export type UserApiKey = InferSelectModel<typeof userApiKeys>;
export type NewUserApiKey = InferInsertModel<typeof userApiKeys>;

export type UserCustomModel = InferSelectModel<typeof userCustomModels>;
export type NewUserCustomModel = InferInsertModel<typeof userCustomModels>;

export type UserProviderPreference = InferSelectModel<typeof userProviderPreferences>;
export type NewUserProviderPreference = InferInsertModel<typeof userProviderPreferences>;

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

export type ChatWithUser = Chat & {
  user: User;
};

export type ChatWithDetails = Chat & {
  folder?: ChatFolder | null;
  tags: ChatTag[];
};

export type OrganizedChats = {
  pinned: ChatWithDetails[];
  folders: Record<string, ChatWithDetails[]>;
  uncategorized: ChatWithDetails[];
  archived: ChatWithDetails[];
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
  sharedBy: User;
};

// Full chat context for AI SDK
export type ChatContextWithMessages = Chat & {
  messages: (Message & { files: File[] })[];
  user: User;
};