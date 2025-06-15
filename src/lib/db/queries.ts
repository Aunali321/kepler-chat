import { eq, desc, and, asc } from 'drizzle-orm';
import { db } from './index';
import { users, chats, messages, files, usageMetrics } from './schema';
import type { 
  NewChat, 
  NewMessage, 
  NewFile, 
  NewUsageMetric,
  ChatWithMessages,
  MessageWithFiles 
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