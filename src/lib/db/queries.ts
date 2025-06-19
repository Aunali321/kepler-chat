import { eq, desc, and, asc, ilike, or, sql, inArray, gte } from "drizzle-orm";
import { db } from "./index";
import {
  chats,
  messages,
  files,
  usageMetrics,
  chatShares,
  userSettings,
  userProviders,
} from "./schema";
import type {
  NewChat,
  NewMessage,
  NewFile,
  NewUsageMetric,
  ChatWithMessages,
  MessageWithFiles,
  NewChatShare,
  NewUserPreferences,
  NewUserApiKey,
  NewUserCustomModel,
  NewUserProviderPreference,
  UserApiKey,
  UserCustomModel,
  UserProviderPreference,
  ProviderType,
  Message,
} from "./types";

// User queries are now handled by BetterAuth
// Use auth.api.getUser() or auth.api.getUserByEmail() instead

// Chat queries with pagination support
export async function getChatsByUserId(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
    pinnedOnly?: boolean;
  } = {}
) {
  const {
    limit = 50,
    offset = 0,
    includeArchived = false,
    pinnedOnly = false,
  } = options;

  let whereConditions = [eq(chats.userId, userId)];

  if (!includeArchived) {
    whereConditions.push(eq(chats.isArchived, false));
  }

  if (pinnedOnly) {
    whereConditions.push(eq(chats.isPinned, true));
  }

  return await db
    .select()
    .from(chats)
    .where(and(...whereConditions))
    .orderBy(desc(chats.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getChatById(chatId: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
  return chat;
}

export async function createChat(data: NewChat) {
  const [chat] = await db.insert(chats).values(data).returning();
  return chat;
}

export async function updateChatTitle(
  chatId: string,
  userId: string,
  title: string
) {
  const [chat] = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning();
  return chat;
}

// Message queries with pagination support
export async function getMessagesByChatId(
  chatId: string,
  options: {
    limit?: number;
    offset?: number;
    cursor?: string; // For cursor-based pagination
  } = {}
) {
  const { limit = 50, offset = 0, cursor } = options;

  let whereConditions = [eq(messages.chatId, chatId)];

  // Cursor-based pagination for better performance with large message lists
  if (cursor) {
    whereConditions.push(sql`${messages.createdAt} > ${cursor}`);
  }

  return await db
    .select()
    .from(messages)
    .where(and(...whereConditions))
    .orderBy(asc(messages.createdAt))
    .limit(limit)
    .offset(cursor ? 0 : offset); // No offset when using cursor
}

export async function getChatWithMessages(
  chatId: string,
  userId: string
): Promise<ChatWithMessages | null> {
  // Single optimized query using JOIN to get chat + messages in one round trip
  const result = await db
    .select({
      chat: chats,
      message: messages,
    })
    .from(chats)
    .leftJoin(messages, eq(messages.chatId, chats.id))
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .orderBy(asc(messages.createdAt));

  if (result.length === 0) return null;

  // Extract chat data from first row (all rows have same chat data)
  const chatData = result[0].chat;

  // Group messages and filter out null messages (from LEFT JOIN)
  const chatMessages = result
    .map((row) => row.message)
    .filter((message) => message !== null);

  return {
    ...chatData,
    messages: chatMessages,
  };
}

export async function getMessageById(
  messageId: string
): Promise<Message | null> {
  const [message] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  return message || null;
}

export async function createMessage(data: NewMessage) {
  // If an ID is provided, check if message already exists
  if (data.id) {
    const existingMessage = await getMessageById(data.id);
    if (existingMessage) {
      console.log("🔄 Message already exists, skipping creation:", data.id);
      return existingMessage;
    }
  }

  // Also check for content-based duplicates to be extra safe
  // Look for messages with same chat_id, role, content within last 5 minutes
  if (data.content && data.content.trim()) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const existingByContent = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.chatId, data.chatId),
          eq(messages.role, data.role),
          eq(messages.content, data.content),
          gte(messages.createdAt, fiveMinutesAgo)
        )
      )
      .limit(1);

    if (existingByContent.length > 0) {
      console.log("🔄 Duplicate message content detected, skipping creation:", {
        chatId: data.chatId,
        role: data.role,
        contentPreview: data.content.substring(0, 50) + "...",
      });
      return existingByContent[0];
    }
  }

  const [message] = await db.insert(messages).values(data).returning();

  // Update chat's updatedAt timestamp
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, data.chatId));

  return message;
}

// Batch operation for creating multiple messages (more efficient)
export async function createMessages(messagesData: NewMessage[]) {
  if (messagesData.length === 0) return [];

  const createdMessages = await db
    .insert(messages)
    .values(messagesData)
    .returning();

  // Update chat timestamps for all affected chats
  const chatIds = [...new Set(messagesData.map((m) => m.chatId))];
  if (chatIds.length > 0) {
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(inArray(chats.id, chatIds));
  }

  return createdMessages;
}

export async function getMessagesWithFiles(
  chatId: string
): Promise<MessageWithFiles[]> {
  const result = await db
    .select({
      message: messages,
      file: files,
    })
    .from(messages)
    .leftJoin(files, eq(files.messageId, messages.id))
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  // Group files by message
  const messagesMap = new Map<string, MessageWithFiles>();

  for (const row of result) {
    const messageId = row.message.id;

    if (!messagesMap.has(messageId)) {
      messagesMap.set(messageId, {
        ...row.message,
        files: [],
      });
    }

    if (row.file) {
      messagesMap.get(messageId)!.files.push(row.file);
    }
  }

  return Array.from(messagesMap.values());
}

// File queries
export async function createFile(data: NewFile) {
  const [file] = await db.insert(files).values(data).returning();
  return file;
}

export async function getFileById(fileId: string, userId: string) {
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  return file;
}

export async function getFilesByUserId(userId: string) {
  return await db
    .select()
    .from(files)
    .where(eq(files.userId, userId))
    .orderBy(desc(files.createdAt));
}

export async function deleteFile(fileId: string, userId: string) {
  const [deletedFile] = await db
    .delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();
  return deletedFile;
}

// Usage metrics queries
export async function createUsageMetric(data: NewUsageMetric) {
  const [metric] = await db.insert(usageMetrics).values(data).returning();
  return metric;
}

export async function getUserUsageMetrics(userId: string, limit: number = 100) {
  return await db
    .select()
    .from(usageMetrics)
    .where(eq(usageMetrics.userId, userId))
    .orderBy(desc(usageMetrics.createdAt))
    .limit(limit);
}

// Utility functions
export async function deleteChat(chatId: string, userId: string) {
  // Messages and files will be cascade deleted due to foreign key constraints
  const [deletedChat] = await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning();
  return deletedChat;
}

// ======= SEARCH QUERIES =======

export async function searchChats(
  userId: string,
  query: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;
  const lowerCaseQuery = query.toLowerCase();

  return await db
    .select()
    .from(chats)
    .where(
      and(eq(chats.userId, userId), ilike(chats.title, `%${lowerCaseQuery}%`))
    )
    .orderBy(desc(chats.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function searchMessages(
  userId: string,
  query: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;
  const lowerCaseQuery = query.toLowerCase();

  return await db
    .select()
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(
      and(
        eq(chats.userId, userId),
        ilike(messages.content, `%${lowerCaseQuery}%`)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
}

// Enhanced search with full-text capabilities (uses the search indexes)
export async function fullTextSearchMessages(
  userId: string,
  query: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  return await db
    .select()
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(
      and(
        eq(chats.userId, userId),
        sql`search_vector @@ to_tsquery('english', ${query})`
      )
    )
    .orderBy(sql`ts_rank(search_vector, to_tsquery('english', ${query})) DESC`)
    .limit(limit)
    .offset(offset);
}

export async function searchChatsAndMessages(
  userId: string,
  query: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 30, offset = 0 } = options;

  const [chatResults, messageResults] = await Promise.all([
    searchChats(userId, query, { limit, offset }),
    searchMessages(userId, query, { limit, offset }),
  ]);

  return { chats: chatResults, messages: messageResults };
}

// Share queries
export async function createChatShare(data: NewChatShare) {
  const [share] = await db.insert(chatShares).values(data).returning();
  return share;
}

export async function getChatShare(shareToken: string) {
  const [share] = await db
    .select()
    .from(chatShares)
    .where(eq(chatShares.shareToken, shareToken));

  if (!share) {
    return null;
  }

  return share;
}

export async function getSharedChatDetails(chatId: string) {
  const [chat] = await db
    .select({
      id: chats.id,
      title: chats.title,
      modelConfig: chats.modelConfig,
      updatedAt: chats.updatedAt,
      userId: chats.userId,
    })
    .from(chats)
    .where(eq(chats.id, chatId));

  if (!chat) return null;

  const messageRecords = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return { ...chat, messages: messageRecords };
}

// User settings (consolidated from userPreferences)
export async function getUserSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  return settings;
}

export async function createUserSettings(data: {
  userId: string;
  preferences?: any;
  chatSettings?: any;
  notificationSettings?: any;
}) {
  const [settings] = await db.insert(userSettings).values(data).returning();
  return settings;
}

export async function updateUserSettings(
  userId: string,
  data: { preferences?: any; chatSettings?: any; notificationSettings?: any }
) {
  const [settings] = await db
    .update(userSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning();
  return settings;
}

export async function getOrCreateUserSettings(userId: string) {
  let settings = await getUserSettings(userId);
  if (!settings) {
    settings = await createUserSettings({ userId });
  }
  return settings;
}

// Utility to update chat's last message timestamp
export async function updateChatLastMessage(chatId: string) {
  await db
    .update(chats)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

// Chat properties (archive, pin)
export async function archiveChat(
  chatId: string,
  userId: string,
  archived: boolean = true
) {
  await db
    .update(chats)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

export async function pinChat(
  chatId: string,
  userId: string,
  pinned: boolean = true
) {
  await db
    .update(chats)
    .set({ isPinned: pinned, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

// ======= CONSOLIDATED PROVIDER MANAGEMENT =======
// Replaces API key, custom model, and provider preference functions

export async function getUserProviders(userId: string) {
  return await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, userId));
}

export async function getUserProvider(userId: string, provider: ProviderType) {
  const [providerConfig] = await db
    .select()
    .from(userProviders)
    .where(
      and(
        eq(userProviders.userId, userId),
        eq(userProviders.provider, provider)
      )
    );
  return providerConfig;
}

export async function createUserProvider(data: {
  userId: string;
  provider: ProviderType;
  encryptedApiKey?: string;
  isEnabled?: boolean;
  defaultModel?: string;
  customModels?: any[];
  settings?: any;
  validationStatus?: "valid" | "invalid" | "pending";
  lastValidated?: Date;
}) {
  const [providerConfig] = await db
    .insert(userProviders)
    .values(data)
    .returning();
  return providerConfig;
}

export async function updateUserProvider(
  userId: string,
  provider: ProviderType,
  data: {
    encryptedApiKey?: string;
    isEnabled?: boolean;
    defaultModel?: string;
    customModels?: any[];
    settings?: any;
    lastValidated?: Date;
    validationStatus?: "valid" | "invalid" | "pending";
  }
) {
  const [providerConfig] = await db
    .update(userProviders)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(userProviders.userId, userId),
        eq(userProviders.provider, provider)
      )
    )
    .returning();
  return providerConfig;
}

export async function deleteUserProvider(
  userId: string,
  provider: ProviderType
) {
  const [providerConfig] = await db
    .delete(userProviders)
    .where(
      and(
        eq(userProviders.userId, userId),
        eq(userProviders.provider, provider)
      )
    )
    .returning();
  return providerConfig;
}

export async function getOrCreateUserProvider(
  userId: string,
  provider: ProviderType
) {
  let providerConfig = await getUserProvider(userId, provider);
  if (!providerConfig) {
    providerConfig = await createUserProvider({ userId, provider });
  }
  return providerConfig;
}

export async function setProviderValidationStatus(
  userId: string,
  provider: ProviderType,
  status: "valid" | "invalid" | "pending"
) {
  await db
    .update(userProviders)
    .set({
      validationStatus: status,
      lastValidated: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userProviders.userId, userId),
        eq(userProviders.provider, provider)
      )
    );
}
