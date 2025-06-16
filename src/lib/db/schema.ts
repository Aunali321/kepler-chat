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

// Chat conversations
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  folderId: uuid('folder_id'), // For future folder organization
  modelConfig: jsonb('model_config').default('{}'),
  isShared: boolean('is_shared').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('chats_user_id_idx').on(table.userId),
  createdAtIdx: index('chats_created_at_idx').on(table.createdAt),
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

// Usage analytics and metrics
export const usageMetrics = pgTable('usage_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  tokensUsed: bigint('tokens_used', { mode: 'number' }).notNull(),
  costEstimate: decimal('cost_estimate', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('usage_metrics_user_id_idx').on(table.userId),
  chatIdIdx: index('usage_metrics_chat_id_idx').on(table.chatId),
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
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  files: many(files),
  customTools: many(customTools),
  usageMetrics: many(usageMetrics),
  sessions: many(sessions),
  accounts: many(account),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
  files: many(files),
  usageMetrics: many(usageMetrics),
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
  chat: one(chats, {
    fields: [files.chatId],
    references: [chats.id],
  }),
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
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

export const verificationRelations = relations(verification, ({ one }) => ({
  user: one(users, {
    fields: [verification.identifier],
    references: [users.email], // Assuming identifier is email for verification
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));