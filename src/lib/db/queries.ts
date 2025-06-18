import { eq, desc, and, asc, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from './index';
import { 
  users, 
  chats, 
  messages, 
  files, 
  usageMetrics,
  chatFolders,
  chatTags,
  chatTagRelations,
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
  NewChatFolder,
  NewChatTag,
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

// ======= CHAT FOLDERS QUERIES =======

export async function getUserFolders(userId: string) {
  return await db
    .select()
    .from(chatFolders)
    .where(eq(chatFolders.userId, userId))
    .orderBy(asc(chatFolders.name));
}

export async function createChatFolder(data: NewChatFolder) {
  const [folder] = await db.insert(chatFolders).values(data).returning();
  return folder;
}

export async function updateChatFolder(folderId: string, userId: string, data: Partial<NewChatFolder>) {
  const [folder] = await db
    .update(chatFolders)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(chatFolders.id, folderId), eq(chatFolders.userId, userId)))
    .returning();
  return folder;
}

export async function deleteChatFolder(folderId: string, userId: string) {
  // Move chats out of folder before deleting
  await db
    .update(chats)
    .set({ folderId: null })
    .where(eq(chats.folderId, folderId));
    
  const [deletedFolder] = await db
    .delete(chatFolders)
    .where(and(eq(chatFolders.id, folderId), eq(chatFolders.userId, userId)))
    .returning();
  return deletedFolder;
}

export async function getChatsByFolder(userId: string, folderId: string | null) {
  return await db
    .select()
    .from(chats)
    .where(and(
      eq(chats.userId, userId),
      folderId ? eq(chats.folderId, folderId) : sql`${chats.folderId} IS NULL`
    ))
    .orderBy(desc(chats.lastMessageAt), desc(chats.updatedAt));
}

export async function moveChatsToFolder(chatIds: string[], folderId: string | null, userId: string) {
  return await db
    .update(chats)
    .set({ folderId, updatedAt: new Date() })
    .where(and(
      inArray(chats.id, chatIds),
      eq(chats.userId, userId)
    ))
    .returning();
}

// ======= CHAT TAGS QUERIES =======

export async function getUserTags(userId: string) {
  return await db
    .select()
    .from(chatTags)
    .where(eq(chatTags.userId, userId))
    .orderBy(asc(chatTags.name));
}

export async function createChatTag(data: NewChatTag) {
  const [tag] = await db.insert(chatTags).values(data).returning();
  return tag;
}

export async function deleteChatTag(tagId: string, userId: string) {
  // Delete all tag relations first
  await db
    .delete(chatTagRelations)
    .where(eq(chatTagRelations.tagId, tagId));
    
  const [deletedTag] = await db
    .delete(chatTags)
    .where(and(eq(chatTags.id, tagId), eq(chatTags.userId, userId)))
    .returning();
  return deletedTag;
}

export async function addTagToChat(chatId: string, tagId: string) {
  const [relation] = await db
    .insert(chatTagRelations)
    .values({ chatId, tagId })
    .returning();
  return relation;
}

export async function removeTagFromChat(chatId: string, tagId: string) {
  const [relation] = await db
    .delete(chatTagRelations)
    .where(and(eq(chatTagRelations.chatId, chatId), eq(chatTagRelations.tagId, tagId)))
    .returning();
  return relation;
}

export async function getChatTags(chatId: string) {
  return await db
    .select({ tag: chatTags })
    .from(chatTagRelations)
    .innerJoin(chatTags, eq(chatTagRelations.tagId, chatTags.id))
    .where(eq(chatTagRelations.chatId, chatId));
}

export async function getChatsByTag(userId: string, tagId: string) {
  return await db
    .select({ chat: chats })
    .from(chatTagRelations)
    .innerJoin(chats, eq(chatTagRelations.chatId, chats.id))
    .where(and(
      eq(chatTagRelations.tagId, tagId),
      eq(chats.userId, userId)
    ))
    .orderBy(desc(chats.lastMessageAt), desc(chats.updatedAt));
}

// ======= CHAT SEARCH QUERIES =======

export async function searchChats(userId: string, query: string, limit: number = 20) {
  const searchTerm = `%${query}%`;
  
  return await db
    .select()
    .from(chats)
    .where(and(
      eq(chats.userId, userId),
      ilike(chats.title, searchTerm)
    ))
    .orderBy(desc(chats.lastMessageAt), desc(chats.updatedAt))
    .limit(limit);
}

export async function searchMessages(userId: string, query: string, limit: number = 50) {
  // Simple search for now, will be replaced with full-text or vector search
  return await db
    .select()
    .from(messages)
    .where(and(
      inArray(messages.chatId, 
        db.select({ id: chats.id }).from(chats).where(eq(chats.userId, userId))
      ),
      ilike(messages.content, `%${query}%`)
    ))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function searchChatsAndMessages(userId: string, query: string, limit: number = 30) {
  const searchTerm = `%${query}%`;
  
  // Search both chat titles and message content
  const chatResults = await searchChats(userId, query, Math.floor(limit / 2));
  const messageResults = await searchMessages(userId, query, Math.floor(limit / 2));
  
  return {
    chats: chatResults,
    messages: messageResults,
  };
}

// ======= CHAT SHARING QUERIES =======

export async function createChatShare(data: NewChatShare) {
  const [share] = await db.insert(chatShares).values(data).returning();
  return share;
}

export async function getChatShare(shareToken: string) {
  const [share] = await db
    .select()
    .from(chatShares)
    .where(eq(chatShares.shareToken, shareToken));

  if (!share) return null;

  const chat = await getSharedChatDetails(share.chatId);

  const [sharedByUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, share.sharedByUserId));

  return {
    ...share,
    chat,
    sharedByUser,
  };
}

export async function getSharedChatDetails(chatId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId));

  if (!chat) return null;

  const messagesResult = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  // Ensure messages have the correct type for the `ai/react` Message interface
  const typedMessages = messagesResult.map((m: typeof messages.$inferSelect) => ({
    ...m,
    id: m.id,
    role: m.role as any,
    content: m.content || '',
    createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
  }));

  return {
    ...chat,
    messages: typedMessages,
  };
}

// ======= USER PREFERENCES QUERIES =======

export async function getUserPreferences(userId: string) {
  const [preferences] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return preferences;
}

export async function createUserPreferences(data: NewUserPreferences) {
  const [preferences] = await db
    .insert(userPreferences)
    .values(data)
    .returning();
  return preferences;
}

export async function updateUserPreferences(userId: string, data: Partial<NewUserPreferences>) {
  const [preferences] = await db
    .update(userPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  return preferences;
}

export async function getOrCreateUserPreferences(userId: string) {
  let preferences = await getUserPreferences(userId);
  
  if (!preferences) {
    preferences = await createUserPreferences({ userId });
  }
  
  return preferences;
}

// ======= ENHANCED CHAT QUERIES =======

export async function updateChatLastMessage(chatId: string) {
  await db
    .update(chats)
    .set({ 
      lastMessageAt: new Date(),
      updatedAt: new Date() 
    })
    .where(eq(chats.id, chatId));
}

export async function getChatWithDetails(chatId: string, userId: string) {
  const [result] = await db
    .select({
      chat: chats,
      folder: chatFolders,
    })
    .from(chats)
    .leftJoin(chatFolders, eq(chats.folderId, chatFolders.id))
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

  if (!result) return null;

  // Get tags for this chat
  const tags = await getChatTags(chatId);
  
  return {
    ...result.chat,
    folder: result.folder,
    tags: tags.map(t => t.tag),
  };
}

export async function archiveChat(chatId: string, userId: string, archived: boolean = true) {
  const [chat] = await db
    .update(chats)
    .set({ isArchived: archived, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning();
  return chat;
}

export async function pinChat(chatId: string, userId: string, pinned: boolean = true) {
  const [chat] = await db
    .update(chats)
    .set({ isPinned: pinned, updatedAt: new Date() })
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning();
  return chat;
}

export async function getOrganizedChats(userId: string) {
  // Get all chats with their folder and tag information
  const result = await db
    .select({
      chat: chats,
      folder: chatFolders,
    })
    .from(chats)
    .leftJoin(chatFolders, eq(chats.folderId, chatFolders.id))
    .where(eq(chats.userId, userId))
    .orderBy(
      desc(chats.isPinned),
      desc(chats.lastMessageAt), 
      desc(chats.updatedAt)
    );

  // Group by folder
  const organized = {
    pinned: [] as any[],
    folders: {} as Record<string, any[]>,
    uncategorized: [] as any[],
    archived: [] as any[],
  };

  for (const row of result) {
    const chatWithFolder = {
      ...row.chat,
      folder: row.folder,
    };

    if (row.chat.isArchived) {
      organized.archived.push(chatWithFolder);
    } else if (row.chat.isPinned) {
      organized.pinned.push(chatWithFolder);
    } else if (row.folder) {
      if (!organized.folders[row.folder.id]) {
        organized.folders[row.folder.id] = [];
      }
      organized.folders[row.folder.id].push(chatWithFolder);
    } else {
      organized.uncategorized.push(chatWithFolder);
    }
  }

  return organized;
}

// ======= API KEY MANAGEMENT QUERIES =======

export async function getUserApiKeys(userId: string) {
  return await db
    .select()
    .from(userApiKeys)
    .where(eq(userApiKeys.userId, userId))
    .orderBy(asc(userApiKeys.provider));
}

export async function getUserApiKey(userId: string, provider: ProviderType) {
  const [apiKey] = await db
    .select()
    .from(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider)
    ));
  return apiKey;
}

export async function createUserApiKey(data: NewUserApiKey) {
  const [apiKey] = await db
    .insert(userApiKeys)
    .values(data)
    .returning();
  return apiKey;
}

export async function updateUserApiKey(userId: string, provider: ProviderType, data: Partial<NewUserApiKey>) {
  const [apiKey] = await db
    .update(userApiKeys)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider)
    ))
    .returning();
  return apiKey;
}

export async function deleteUserApiKey(userId: string, provider: ProviderType) {
  const [apiKey] = await db
    .delete(userApiKeys)
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider)
    ))
    .returning();
  return apiKey;
}

export async function setApiKeyValidationStatus(userId: string, provider: ProviderType, status: 'valid' | 'invalid' | 'pending') {
  const [apiKey] = await db
    .update(userApiKeys)
    .set({ 
      validationStatus: status,
      lastValidated: new Date(),
      updatedAt: new Date()
    })
    .where(and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider)
    ))
    .returning();
  return apiKey;
}

// ======= CUSTOM MODEL MANAGEMENT QUERIES =======

export async function getUserCustomModels(userId: string, provider?: ProviderType) {
  const conditions = [eq(userCustomModels.userId, userId)];
  if (provider) {
    conditions.push(eq(userCustomModels.provider, provider));
  }
  
  return await db
    .select()
    .from(userCustomModels)
    .where(and(...conditions))
    .orderBy(asc(userCustomModels.provider), asc(userCustomModels.displayName));
}

export async function getUserCustomModel(userId: string, modelId: string) {
  const [model] = await db
    .select()
    .from(userCustomModels)
    .where(and(
      eq(userCustomModels.userId, userId),
      eq(userCustomModels.id, modelId)
    ));
  return model;
}

export async function createUserCustomModel(data: NewUserCustomModel) {
  const [model] = await db
    .insert(userCustomModels)
    .values(data)
    .returning();
  return model;
}

export async function updateUserCustomModel(userId: string, modelId: string, data: Partial<NewUserCustomModel>) {
  const [model] = await db
    .update(userCustomModels)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(userCustomModels.userId, userId),
      eq(userCustomModels.id, modelId)
    ))
    .returning();
  return model;
}

export async function deleteUserCustomModel(userId: string, modelId: string) {
  const [model] = await db
    .delete(userCustomModels)
    .where(and(
      eq(userCustomModels.userId, userId),
      eq(userCustomModels.id, modelId)
    ))
    .returning();
  return model;
}

// ======= PROVIDER PREFERENCE QUERIES =======

export async function getUserProviderPreferences(userId: string) {
  return await db
    .select()
    .from(userProviderPreferences)
    .where(eq(userProviderPreferences.userId, userId))
    .orderBy(asc(userProviderPreferences.provider));
}

export async function getUserProviderPreference(userId: string, provider: ProviderType) {
  const [preference] = await db
    .select()
    .from(userProviderPreferences)
    .where(and(
      eq(userProviderPreferences.userId, userId),
      eq(userProviderPreferences.provider, provider)
    ));
  return preference;
}

export async function createUserProviderPreference(data: NewUserProviderPreference) {
  const [preference] = await db
    .insert(userProviderPreferences)
    .values(data)
    .returning();
  return preference;
}

export async function updateUserProviderPreference(userId: string, provider: ProviderType, data: Partial<NewUserProviderPreference>) {
  const [preference] = await db
    .update(userProviderPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(and(
      eq(userProviderPreferences.userId, userId),
      eq(userProviderPreferences.provider, provider)
    ))
    .returning();
  return preference;
}

export async function deleteUserProviderPreference(userId: string, provider: ProviderType) {
  const [preference] = await db
    .delete(userProviderPreferences)
    .where(and(
      eq(userProviderPreferences.userId, userId),
      eq(userProviderPreferences.provider, provider)
    ))
    .returning();
  return preference;
}

export async function getOrCreateUserProviderPreference(userId: string, provider: ProviderType) {
  let preference = await getUserProviderPreference(userId, provider);
  
  if (!preference) {
    preference = await createUserProviderPreference({ 
      userId, 
      provider,
      isEnabled: false // Default to disabled until API key is added
    });
  }
  
  return preference;
}