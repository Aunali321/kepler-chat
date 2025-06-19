import { pgTable, uuid, varchar, text, timestamp, jsonb, bigint, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// BetterAuth will create and manage the users table automatically
// We'll reference it using string 'user' in foreign keys

// BetterAuth will create and manage the sessions table automatically

// BetterAuth will create and manage the account table automatically

// Chat sharing permissions
export const chatShares = pgTable('chat_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  sharedByUserId: varchar('shared_by_user_id', { length: 255 }).notNull(),
  shareToken: varchar('share_token', { length: 255 }).unique(), // For public sharing
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  chatIdIdx: index('chat_shares_chat_id_idx').on(table.chatId),
  sharedByUserIdIdx: index('chat_shares_shared_by_user_id_idx').on(table.sharedByUserId),
  shareTokenIdx: index('chat_shares_share_token_idx').on(table.shareToken),
}));

// Consolidated user settings (replaces userPreferences)
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  preferences: jsonb('preferences').default('{}'), // theme, language, UI settings
  chatSettings: jsonb('chat_settings').default('{}'), // chat-specific settings
  notificationSettings: jsonb('notification_settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_settings_user_id_idx').on(table.userId),
}));

// Chat conversations
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  modelConfig: jsonb('model_config').default('{}'),
  isShared: boolean('is_shared').default(false),
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('chats_user_id_idx').on(table.userId),
  createdAtIdx: index('chats_created_at_idx').on(table.createdAt),
  lastMessageAtIdx: index('chats_last_message_at_idx').on(table.lastMessageAt),
  titleIdx: index('chats_title_idx').on(table.title), // For search
  // Composite index for common query patterns
  userUpdatedIdx: index('chats_user_updated_idx').on(table.userId, table.updatedAt),
  userFiltersIdx: index('chats_user_filters_idx').on(table.userId, table.isArchived, table.isPinned, table.updatedAt),
}));

// Individual messages with multi-part support
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system', 'tool'
  content: text('content'),
  parts: jsonb('parts').default('[]'), // Multi-part messages (text, image, etc.)
  toolInvocations: jsonb('tool_invocations').default('[]'), // Vercel AI SDK v3 tool calls
  provider: varchar('provider', { length: 50 }),
  model: varchar('model', { length: 100 }),
  usage: jsonb('usage'), // Token usage information
  finishReason: varchar('finish_reason', { length: 50 }),
  metadata: jsonb('metadata').default('{}'), // Additional metadata including experimental_attachments
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  // For future semantic search
  contentVector: text('content_vector'), // Will be vector type when pgvector is added
}, (table) => ({
  chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  roleIdx: index('messages_role_idx').on(table.role),
  // Composite index for optimized chat message queries
  chatCreatedIdx: index('messages_chat_created_idx').on(table.chatId, table.createdAt),
  // Full-text search index will be added via SQL migration
}));

// File attachments and metadata
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'set null' }),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  r2Key: varchar('r2_key', { length: 500 }).notNull().unique(),
  r2Url: text('r2_url').notNull(),
  status: varchar('status', { length: 20 }).default('uploaded'), // 'uploaded', 'processing', 'analyzed'
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('files_user_id_idx').on(table.userId),
  chatIdIdx: index('files_chat_id_idx').on(table.chatId),
  r2KeyIdx: index('files_r2_key_idx').on(table.r2Key),
  // Composite index for file lookup by chat
  chatCreatedIdx: index('files_chat_created_idx').on(table.chatId, table.createdAt),
}));

// Consolidated provider configurations (replaces userApiKeys, userCustomModels, userProviderPreferences)
export const userProviders = pgTable('user_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'openai', 'anthropic', 'google', 'openrouter', etc.
  encryptedApiKey: text('encrypted_api_key'),
  isEnabled: boolean('is_enabled').default(true),
  defaultModel: varchar('default_model', { length: 100 }),
  customModels: jsonb('custom_models').default('[]'), // array of custom model configs
  settings: jsonb('settings').default('{}'), // provider-specific settings
  lastValidated: timestamp('last_validated', { withTimezone: true }),
  validationStatus: varchar('validation_status', { length: 20 }).default('pending'), // 'pending', 'valid', 'invalid'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_providers_user_id_idx').on(table.userId),
  providerIdx: index('user_providers_provider_idx').on(table.provider),
  userProviderIdx: index('user_providers_user_provider_idx').on(table.userId, table.provider),
}));

// These tables have been consolidated into userProviders above

// Custom tool registry for users
export const customTools = pgTable('custom_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).references(() => userProviders.userId, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  parameters: jsonb('parameters').notNull(), // Zod schema for the tool
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('custom_tools_user_id_idx').on(table.userId),
  nameIdx: index('custom_tools_name_idx').on(table.name),
}));

// Usage metrics for tracking token usage and costs
export const usageMetrics = pgTable('usage_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'set null' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  tokensUsed: bigint('tokens_used', { mode: 'number' }).notNull(),
  costEstimate: decimal('cost_estimate', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('usage_metrics_user_id_idx').on(table.userId),
  chatIdIdx: index('usage_metrics_chat_id_idx').on(table.chatId),
  providerIdx: index('usage_metrics_provider_idx').on(table.provider),
  createdAtIdx: index('usage_metrics_created_at_idx').on(table.createdAt),
}));

// BetterAuth will create and manage the verification table automatically

// Define relationships (BetterAuth handles user/session/account relations)
// We only define relations for our custom tables

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
  files: many(files),
  usageMetrics: many(usageMetrics),
  chatShares: many(chatShares),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
  }),
  chat: one(chats, {
    fields: [files.chatId],
    references: [chats.id],
  }),
}));

export const customToolsRelations = relations(customTools, ({ one }) => ({
  // BetterAuth manages user relations
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  chat: one(chats, {
    fields: [usageMetrics.chatId],
    references: [chats.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  // BetterAuth manages user relations
}));

export const userProvidersRelations = relations(userProviders, ({ one }) => ({
  // BetterAuth manages user relations
}));

// BetterAuth handles verification relations automatically