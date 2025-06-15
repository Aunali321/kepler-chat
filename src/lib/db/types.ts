import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, chats, messages, files, customTools, usageMetrics, sessions } from './schema';

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

// Message role enum
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// File status enum
export type FileStatus = 'uploaded' | 'processing' | 'analyzed';

// Chat with related data
export type ChatWithMessages = Chat & {
  messages: Message[];
};

export type ChatWithUser = Chat & {
  user: User;
};

// Message with related data
export type MessageWithFiles = Message & {
  files: File[];
};

// Full chat context for AI SDK
export type ChatContextWithMessages = Chat & {
  messages: (Message & { files: File[] })[];
  user: User;
};