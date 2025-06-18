import { pgTable, uuid, varchar, text, timestamp, jsonb, bigint, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (will be managed by BetterAuth but we define it for completeness)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Sessions table (managed by BetterAuth)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Accounts table (for social authentication)
export const account = pgTable('account', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Chat sharing permissions
export const chatShares = pgTable('chat_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  sharedByUserId: varchar('shared_by_user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 255 }).unique(), // For public sharing
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  chatIdIdx: index('chat_shares_chat_id_idx').on(table.chatId),
  sharedByUserIdIdx: index('chat_shares_shared_by_user_id_idx').on(table.sharedByUserId),
  shareTokenIdx: index('chat_shares_share_token_idx').on(table.shareToken),
}));

// User preferences for customization
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  theme: varchar('theme', { length: 20 }).default('system'), // 'light', 'dark', 'system'
  language: varchar('language', { length: 10 }).default('en'),
  chatSettings: jsonb('chat_settings').default('{}'), // Stream speed, auto-save, etc.
  uiSettings: jsonb('ui_settings').default('{}'), // Sidebar width, font size, etc.
  notificationSettings: jsonb('notification_settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_preferences_user_id_idx').on(table.userId),
}));

// Chat conversations
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  // Full-text search index will be added via SQL migration
}));

// File attachments and metadata
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
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
}));

// User API keys (encrypted storage)
export const userApiKeys = pgTable('user_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'openai', 'anthropic', 'google', 'openrouter', etc.
  encryptedApiKey: text('encrypted_api_key').notNull(),
  isActive: boolean('is_active').default(true),
  lastValidated: timestamp('last_validated', { withTimezone: true }),
  validationStatus: varchar('validation_status', { length: 20 }).default('pending'), // 'pending', 'valid', 'invalid'
  metadata: jsonb('metadata').default('{}'), // Store additional provider-specific config
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_api_keys_user_id_idx').on(table.userId),
  providerIdx: index('user_api_keys_provider_idx').on(table.provider),
  userProviderIdx: index('user_api_keys_user_provider_idx').on(table.userId, table.provider),
}));

// User custom models
export const userCustomModels = pgTable('user_custom_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  modelId: varchar('model_id', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  maxTokens: bigint('max_tokens', { mode: 'number' }).default(4096),
  supportsVision: boolean('supports_vision').default(false),
  supportsTools: boolean('supports_tools').default(false),
  supportsAudio: boolean('supports_audio').default(false),
  supportsVideo: boolean('supports_video').default(false),
  supportsDocument: boolean('supports_document').default(false),
  costPer1kInputTokens: decimal('cost_per_1k_input_tokens', { precision: 10, scale: 6 }).default('0'),
  costPer1kOutputTokens: decimal('cost_per_1k_output_tokens', { precision: 10, scale: 6 }).default('0'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'), // Additional model parameters
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_custom_models_user_id_idx').on(table.userId),
  providerIdx: index('user_custom_models_provider_idx').on(table.provider),
  userProviderIdx: index('user_custom_models_user_provider_idx').on(table.userId, table.provider),
  modelIdIdx: index('user_custom_models_model_id_idx').on(table.modelId),
}));

// User provider preferences
export const userProviderPreferences = pgTable('user_provider_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  isEnabled: boolean('is_enabled').default(true),
  defaultModel: varchar('default_model', { length: 100 }),
  settings: jsonb('settings').default('{}'), // Provider-specific settings
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_provider_preferences_user_id_idx').on(table.userId),
  providerIdx: index('user_provider_preferences_provider_idx').on(table.provider),
  userProviderIdx: index('user_provider_preferences_user_provider_idx').on(table.userId, table.provider),
}));

// Custom tool registry for users
export const customTools = pgTable('custom_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'cascade' }),
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
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
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

// BetterAuth verification table
export const verification = pgTable('verification', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(account),
  chats: many(chats),
  files: many(files),
  customTools: many(customTools),
  usageMetrics: many(usageMetrics),
  userPreferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  apiKeys: many(userApiKeys),
  customModels: many(userCustomModels),
  providerPreferences: many(userProviderPreferences),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
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
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
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
  user: one(users, {
    fields: [customTools.userId],
    references: [users.id],
  }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  user: one(users, {
    fields: [usageMetrics.userId],
    references: [users.id],
  }),
  chat: one(chats, {
    fields: [usageMetrics.chatId],
    references: [chats.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [userApiKeys.userId],
    references: [users.id],
  }),
}));

export const userCustomModelsRelations = relations(userCustomModels, ({ one }) => ({
  user: one(users, {
    fields: [userCustomModels.userId],
    references: [users.id],
  }),
}));

export const userProviderPreferencesRelations = relations(userProviderPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userProviderPreferences.userId],
    references: [users.id],
  }),
}));

export const verificationRelations = relations(verification, ({ one }) => ({
  user: one(users, {
    fields: [verification.identifier],
    references: [users.email], // Assuming identifier is email for verification
  }),
}));