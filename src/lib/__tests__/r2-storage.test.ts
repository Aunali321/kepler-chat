import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import * as r2Storage from '../r2-storage'

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://files.example.com',
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('R2 Storage Utilities', () => {
  describe('validateFile', () => {
    it('validates file size', () => {
      const largeFile = {
        name: 'large.txt',
        type: 'text/plain',
        size: 100 * 1024 * 1024, // 100MB
      }
      
      const result = r2Storage.validateFile(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size must be less than')
    })

    it('validates file type', () => {
      const invalidFile = {
        name: 'script.exe',
        type: 'application/x-executable',
        size: 1024,
      }
      
      const result = r2Storage.validateFile(invalidFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File type')
      expect(result.error).toContain('is not allowed')
    })

    it('validates valid files', () => {
      const validFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024,
      }
      
      const result = r2Storage.validateFile(validFile)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('generateFileKey', () => {
    it('generates unique file keys', () => {
      const key1 = r2Storage.generateFileKey('user-1', 'test.txt', 'chat-1')
      const key2 = r2Storage.generateFileKey('user-1', 'test.txt', 'chat-1')
      
      expect(key1).toMatch(/^chats\/chat-1\/user-1\/\d+-\w+\.txt$/)
      expect(key2).toMatch(/^chats\/chat-1\/user-1\/\d+-\w+\.txt$/)
      expect(key1).not.toEqual(key2)
    })

    it('generates keys without chat ID', () => {
      const key = r2Storage.generateFileKey('user-1', 'test.txt')
      
      expect(key).toMatch(/^uploads\/user-1\/\d+-\w+\.txt$/)
    })

    it('handles files without extensions', () => {
      const key = r2Storage.generateFileKey('user-1', 'README')
      
      expect(key).toMatch(/^uploads\/user-1\/\d+-\w+\.$/)
    })
  })

  describe('getPresignedUploadUrl', () => {
    it('generates presigned upload URL', async () => {
      const url = await r2Storage.getPresignedUploadUrl(
        'test-key',
        'text/plain',
        600
      )
      
      expect(url).toBe('https://presigned-url.example.com')
    })
  })

  describe('getPublicUrl', () => {
    it('generates public URL', () => {
      const url = r2Storage.getPublicUrl('test-key')
      
      expect(url).toBe('https://files.example.com/test-key')
    })
  })

  describe('extractFileInfo', () => {
    it('extracts file information', () => {
      const mockFile = {
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        lastModified: 1640995200000, // 2022-01-01
      } as File
      
      const info = r2Storage.extractFileInfo(mockFile)
      
      expect(info).toEqual({
        name: 'test.txt',
        type: 'text/plain',
        size: 1024,
        lastModified: new Date(1640995200000),
      })
    })
  })

  describe('File type checking utilities', () => {
    it('identifies image files', () => {
      expect(r2Storage.isImageFile('image/jpeg')).toBe(true)
      expect(r2Storage.isImageFile('image/png')).toBe(true)
      expect(r2Storage.isImageFile('text/plain')).toBe(false)
    })

    it('identifies document files', () => {
      expect(r2Storage.isDocumentFile('application/pdf')).toBe(true)
      expect(r2Storage.isDocumentFile('text/plain')).toBe(true)
      expect(r2Storage.isDocumentFile('image/jpeg')).toBe(false)
    })

    it('identifies audio files', () => {
      expect(r2Storage.isAudioFile('audio/mpeg')).toBe(true)
      expect(r2Storage.isAudioFile('audio/wav')).toBe(true)
      expect(r2Storage.isAudioFile('video/mp4')).toBe(false)
    })

    it('identifies video files', () => {
      expect(r2Storage.isVideoFile('video/mp4')).toBe(true)
      expect(r2Storage.isVideoFile('video/webm')).toBe(true)
      expect(r2Storage.isVideoFile('audio/mpeg')).toBe(false)
    })
  })

  describe('getFileExtension', () => {
    it('extracts file extensions', () => {
      expect(r2Storage.getFileExtension('test.txt')).toBe('txt')
      expect(r2Storage.getFileExtension('document.pdf')).toBe('pdf')
      expect(r2Storage.getFileExtension('archive.tar.gz')).toBe('gz')
      expect(r2Storage.getFileExtension('README')).toBe('')
    })
  })
})