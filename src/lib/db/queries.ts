import { eq, desc, and, asc, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import { 
  users, 
  chats, 
  messages, 
  files, 
  usageMetrics,
  chatShares,
  userPreferences,
  userApiKeys,
  userCustomModels,
  userProviderPreferences
} from './schema';
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
  ProviderType
} from './types';

// User queries
export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

// Chat queries
export async function getChatsByUserId(userId: string) {
  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
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

export async function updateChatTitle(chatId: string, userId: string, title: string) {
  const [chat] = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning();
  return chat;
}

// Message queries
export async function getMessagesByChatId(chatId: string, limit: number = 50) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function getChatWithMessages(chatId: string, userId: string): Promise<ChatWithMessages | null> {
  const chat = await getChatById(chatId, userId);
  if (!chat) return null;

  const chatMessages = await getMessagesByChatId(chatId);
  
  return {
    ...chat,
    messages: chatMessages,
  };
}

export async function createMessage(data: NewMessage) {
  const [message] = await db.insert(messages).values(data).returning();
  
  // Update chat's updatedAt timestamp
  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, data.chatId));
  
  return message;
}

export async function getMessagesWithFiles(chatId: string): Promise<MessageWithFiles[]> {
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

export async function searchChats(userId: string, query: string, limit: number = 20) {
  const lowerCaseQuery = query.toLowerCase();
  return await db
    .select()
    .from(chats)
    .where(and(
      eq(chats.userId, userId),
      ilike(chats.title, `%${lowerCaseQuery}%`)
    ))
    .orderBy(desc(chats.updatedAt))
    .limit(limit);
}

export async function searchMessages(userId: string, query: string, limit: number = 50) {
  const lowerCaseQuery = query.toLowerCase();
  return await db
    .select()
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(and(
      eq(chats.userId, userId),
      ilike(messages.content, `%${lowerCaseQuery}%`)
    ))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function searchChatsAndMessages(userId: string, query: string, limit: number = 30) {
  const chatResults = await searchChats(userId, query, limit);
  const messageResults = await searchMessages(userId, query, limit);
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
      user: {
        id: users.id,
        name: users.name,
        image: users.image,
      }
    })
    .from(chats)
    .where(eq(chats.id, chatId))
    .innerJoin(users, eq(chats.userId, users.id));

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


// User preferences
export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return prefs;
}

export async function createUserPreferences(data: NewUserPreferences) {
  const [prefs] = await db
    .insert(userPreferences)
    .values(data)
    .returning();
  return prefs;
}

export async function updateUserPreferences(userId: string, data: Partial<NewUserPreferences>) {
  const [prefs] = await db
    .update(userPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  return prefs;
}

export async function getOrCreateUserPreferences(userId: string) {
  let prefs = await getUserPreferences(userId);
  if (!prefs) {
    prefs = await createUserPreferences({ userId });
  }
  return prefs;
}

// Utility to update chat's last message timestamp
export async function updateChatLastMessage(chatId: string) {
  await db
    .update(chats)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(chats.id, chatId));
}

// Chat properties (archive, pin)
export async function archiveChat(chatId: string, userId: string, archived: boolean = true) {
  await db
    .update(chats)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

export async function pinChat(chatId: string, userId: string, pinned: boolean = true) {
  await db
    .update(chats)
    .set({ isPinned: pinned, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
}

// ======= API KEY MANAGEMENT =======

export async function getUserApiKeys(userId: string): Promise<UserApiKey[]> {
  return await db
    .select()
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId));
}

export async function getUserApiKey(userId: string, provider: ProviderType): Promise<UserApiKey | undefined> {
  const [key] = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
  return key;
}

export async function createUserApiKey(data: NewUserApiKey): Promise<UserApiKey> {
  const [key] = await db.insert(userApiKeys).values(data).returning();
  return key;
}

export async function updateUserApiKey(userId: string, provider: ProviderType, data: Partial<NewUserApiKey>): Promise<UserApiKey> {
  const [key] = await db
    .update(userApiKeys)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
    .returning();
  return key;
}

export async function deleteUserApiKey(userId: string, provider: ProviderType): Promise<UserApiKey | undefined> {
  const [key] = await db
    .delete(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)))
    .returning();
  return key;
}

export async function setApiKeyValidationStatus(
  userId: string, 
  provider: ProviderType, 
  status: 'valid' | 'invalid' | 'pending'
) {
  await db
    .update(userApiKeys)
    .set({ validationStatus: status, updatedAt: new Date() })
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.provider, provider)));
}


// ======= CUSTOM MODEL MANAGEMENT =======

export async function getUserCustomModels(userId: string, provider?: ProviderType): Promise<UserCustomModel[]> {
  if (provider) {
    return await db.select().from(userCustomModels).where(
      and(eq(userCustomModels.userId, userId), eq(userCustomModels.provider, provider))
    );
  }
  return await db.select().from(userCustomModels).where(eq(userCustomModels.userId, userId));
}

export async function getUserCustomModel(userId: string, modelId: string): Promise<UserCustomModel | undefined> {
  const [model] = await db
    .select()
    .from(userCustomModels)
    .where(and(eq(userCustomModels.userId, userId), eq(userCustomModels.id, modelId)));
  return model;
}

export async function createUserCustomModel(data: NewUserCustomModel): Promise<UserCustomModel> {
  const [model] = await db.insert(userCustomModels).values(data).returning();
  return model;
}

export async function updateUserCustomModel(userId: string, modelId: string, data: Partial<NewUserCustomModel>): Promise<UserCustomModel> {
  const [model] = await db
    .update(userCustomModels)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userCustomModels.userId, userId), eq(userCustomModels.id, modelId)))
    .returning();
  return model;
}

export async function deleteUserCustomModel(userId: string, modelId: string): Promise<UserCustomModel | undefined> {
  const [model] = await db
    .delete(userCustomModels)
    .where(and(eq(userCustomModels.userId, userId), eq(userCustomModels.id, modelId)))
    .returning();
  return model;
}

// ======= PROVIDER PREFERENCES =======

export async function getUserProviderPreferences(userId: string): Promise<UserProviderPreference[]> {
  return await db
    .select()
    .from(userProviderPreferences)
    .where(eq(userProviderPreferences.userId, userId));
}

export async function getUserProviderPreference(userId: string, provider: ProviderType): Promise<UserProviderPreference | undefined> {
  const [prefs] = await db
    .select()
    .from(userProviderPreferences)
    .where(and(eq(userProviderPreferences.userId, userId), eq(userProviderPreferences.provider, provider)));
  return prefs;
}

export async function createUserProviderPreference(data: NewUserProviderPreference): Promise<UserProviderPreference> {
  const [prefs] = await db.insert(userProviderPreferences).values(data).returning();
  return prefs;
}

export async function updateUserProviderPreference(userId: string, provider: ProviderType, data: Partial<NewUserProviderPreference>): Promise<UserProviderPreference> {
  const [prefs] = await db
    .update(userProviderPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(userProviderPreferences.userId, userId), eq(userProviderPreferences.provider, provider)))
    .returning();
  return prefs;
}

export async function deleteUserProviderPreference(userId: string, provider: ProviderType): Promise<UserProviderPreference | undefined> {
  const [prefs] = await db
    .delete(userProviderPreferences)
    .where(and(eq(userProviderPreferences.userId, userId), eq(userProviderPreferences.provider, provider)))
    .returning();
  return prefs;
}

export async function getOrCreateUserProviderPreference(userId: string, provider: ProviderType): Promise<UserProviderPreference> {
  let prefs = await getUserProviderPreference(userId, provider);
  if (!prefs) {
    prefs = await createUserProviderPreference({ userId, provider });
  }
  return prefs;
}