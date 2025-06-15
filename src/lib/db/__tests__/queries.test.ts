import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as queries from '../queries'

// Mock the database
jest.mock('../index', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
}))

// Mock Drizzle ORM functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value, type: 'eq' })),
  desc: jest.fn((field) => ({ field, type: 'desc' })),
  asc: jest.fn((field) => ({ field, type: 'asc' })),
  and: jest.fn((...conditions) => ({ conditions, type: 'and' })),
}))

const mockDb = require('../index').db

describe('Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserById', () => {
    it('fetches user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      }
      
      mockDb.returning.mockResolvedValue([mockUser])
      
      const result = await queries.getUserById('user-1')
      
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.from).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('returns undefined when user not found', async () => {
      mockDb.returning.mockResolvedValue([])
      
      const result = await queries.getUserById('nonexistent')
      
      expect(result).toBeUndefined()
    })
  })

  describe('createChat', () => {
    it('creates a new chat', async () => {
      const mockChat = {
        id: 'chat-1',
        userId: 'user-1',
        title: 'Test Chat',
        createdAt: new Date(),
      }
      
      const chatData = {
        userId: 'user-1',
        title: 'Test Chat',
      }
      
      mockDb.returning.mockResolvedValue([mockChat])
      
      const result = await queries.createChat(chatData)
      
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(chatData)
      expect(mockDb.returning).toHaveBeenCalled()
      expect(result).toEqual(mockChat)
    })
  })

  describe('createMessage', () => {
    it('creates a new message and updates chat timestamp', async () => {
      const mockMessage = {
        id: 'message-1',
        chatId: 'chat-1',
        role: 'user',
        content: 'Hello',
        createdAt: new Date(),
      }
      
      const messageData = {
        chatId: 'chat-1',
        role: 'user' as const,
        content: 'Hello',
      }
      
      mockDb.returning.mockResolvedValueOnce([mockMessage]) // For insert
      mockDb.returning.mockResolvedValueOnce([]) // For update
      
      const result = await queries.createMessage(messageData)
      
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled() // Should update chat timestamp
      expect(result).toEqual(mockMessage)
    })
  })

  describe('getChatsByUserId', () => {
    it('fetches chats for a user ordered by update time', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          userId: 'user-1',
          title: 'Chat 1',
          updatedAt: new Date(),
        },
        {
          id: 'chat-2',
          userId: 'user-1',
          title: 'Chat 2',
          updatedAt: new Date(),
        },
      ]
      
      mockDb.returning.mockResolvedValue(mockChats)
      
      const result = await queries.getChatsByUserId('user-1')
      
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
      expect(result).toEqual(mockChats)
    })
  })

  describe('createFile', () => {
    it('creates a new file record', async () => {
      const mockFile = {
        id: 'file-1',
        userId: 'user-1',
        chatId: 'chat-1',
        filename: 'test.txt',
        mimeType: 'text/plain',
        fileSize: 1024,
        r2Key: 'files/test.txt',
        r2Url: 'https://example.com/test.txt',
      }
      
      const fileData = {
        userId: 'user-1',
        chatId: 'chat-1',
        filename: 'test.txt',
        mimeType: 'text/plain',
        fileSize: 1024,
        r2Key: 'files/test.txt',
        r2Url: 'https://example.com/test.txt',
        status: 'uploaded' as const,
        metadata: {},
      }
      
      mockDb.returning.mockResolvedValue([mockFile])
      
      const result = await queries.createFile(fileData)
      
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(fileData)
      expect(result).toEqual(mockFile)
    })
  })

  describe('deleteChat', () => {
    it('deletes a chat and returns the deleted record', async () => {
      const mockDeletedChat = {
        id: 'chat-1',
        userId: 'user-1',
        title: 'Deleted Chat',
      }
      
      mockDb.returning.mockResolvedValue([mockDeletedChat])
      
      const result = await queries.deleteChat('chat-1', 'user-1')
      
      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.returning).toHaveBeenCalled()
      expect(result).toEqual(mockDeletedChat)
    })
  })

  describe('getMessagesWithFiles', () => {
    it('fetches messages with associated files', async () => {
      const mockResult = [
        {
          message: {
            id: 'message-1',
            chatId: 'chat-1',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
          file: {
            id: 'file-1',
            filename: 'test.txt',
            r2Url: 'https://example.com/test.txt',
          },
        },
        {
          message: {
            id: 'message-1',
            chatId: 'chat-1',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
          file: null,
        },
      ]
      
      mockDb.returning.mockResolvedValue(mockResult)
      
      const result = await queries.getMessagesWithFiles('chat-1')
      
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.leftJoin).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
      
      // Should group files by message
      expect(result).toHaveLength(1)
      expect(result[0].files).toHaveLength(1)
    })
  })
})