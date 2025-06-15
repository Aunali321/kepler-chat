import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { POST } from '../upload-url/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/auth-server', () => ({
  requireAuthApi: jest.fn(),
}))

jest.mock('@/lib/r2-storage', () => ({
  validateFile: jest.fn(),
  generateFileKey: jest.fn(),
  getPresignedUploadUrl: jest.fn(),
  ALLOWED_FILE_TYPES: {
    'text/plain': ['.txt'],
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
  },
}))

const mockRequireAuthApi = require('@/lib/auth-server').requireAuthApi
const mockR2Storage = require('@/lib/r2-storage')

describe('/api/files/upload-url', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockRequireAuthApi.mockResolvedValue({
      user: { id: 'user-1' },
    })
    
    mockR2Storage.validateFile.mockReturnValue({ valid: true })
    mockR2Storage.generateFileKey.mockReturnValue('files/user-1/test.txt')
    mockR2Storage.getPresignedUploadUrl.mockResolvedValue('https://presigned-url.example.com')
  })

  it('generates upload URL for valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      uploadUrl: 'https://presigned-url.example.com',
      fileKey: 'files/user-1/test.txt',
      expiresIn: 600,
      metadata: {
        originalFilename: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        userId: 'user-1',
        chatId: 'chat-1',
      },
    })
  })

  it('returns 401 for unauthenticated requests', async () => {
    mockRequireAuthApi.mockResolvedValue({
      error: 'Unauthorized',
      status: 401,
    })

    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    
    expect(response.status).toBe(401)
  })

  it('validates request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: '', // Invalid: empty filename
        contentType: 'text/plain',
        size: 1024,
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('validates file type', async () => {
    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'script.exe',
        contentType: 'application/x-executable', // Not in ALLOWED_FILE_TYPES
        size: 1024,
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('validates file size and type', async () => {
    mockR2Storage.validateFile.mockReturnValue({
      valid: false,
      error: 'File too large',
    })

    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'large.txt',
        contentType: 'text/plain',
        size: 100 * 1024 * 1024, // 100MB
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('File too large')
  })

  it('handles missing chatId', async () => {
    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        // chatId missing
      }),
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('handles R2 errors gracefully', async () => {
    mockR2Storage.getPresignedUploadUrl.mockRejectedValue(new Error('R2 service unavailable'))

    const request = new NextRequest('http://localhost:3000/api/files/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.txt',
        contentType: 'text/plain',
        size: 1024,
        chatId: 'chat-1',
      }),
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate upload URL')
  })
})