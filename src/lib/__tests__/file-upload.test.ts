import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { uploadFile, uploadMultipleFiles, validateFileClient, formatFileSize, getFileCategory } from '../file-upload'

// Mock fetch
global.fetch = jest.fn()

describe('File Upload Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('validateFileClient', () => {
    it('validates file size', () => {
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      })
      
      const result = validateFileClient(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size must be less than')
    })

    it('validates file type', () => {
      const invalidFile = new File(['content'], 'script.exe', {
        type: 'application/x-executable',
      })
      
      const result = validateFileClient(invalidFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File type')
      expect(result.error).toContain('is not allowed')
    })

    it('accepts valid files', () => {
      const validFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      })
      
      const result = validateFileClient(validFile)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('uploadFile', () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    const mockOptions = { chatId: 'chat-1' }

    it('uploads file successfully', async () => {
      // Mock API responses
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://presigned.example.com',
            fileKey: 'files/test.txt',
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true, // R2 upload
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            file: {
              id: 'file-1',
              filename: 'test.txt',
              url: 'https://files.example.com/test.txt',
              contentType: 'text/plain',
              size: 7,
              uploadedAt: '2023-01-01T00:00:00.000Z',
            },
          }),
        })

      const result = await uploadFile(mockFile, mockOptions)

      expect(result.success).toBe(true)
      expect(result.file).toEqual({
        id: 'file-1',
        filename: 'test.txt',
        url: 'https://files.example.com/test.txt',
        contentType: 'text/plain',
        size: 7,
        uploadedAt: '2023-01-01T00:00:00.000Z',
      })

      // Check API calls
      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/files/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'test.txt',
          contentType: 'text/plain',
          size: 7,
          chatId: 'chat-1',
        }),
      })
    })

    it('handles upload URL generation failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'Invalid file type',
        }),
      })

      const result = await uploadFile(mockFile, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid file type')
    })

    it('handles R2 upload failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://presigned.example.com',
            fileKey: 'files/test.txt',
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: false, // R2 upload failure
        })

      const result = await uploadFile(mockFile, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to upload file to storage')
    })

    it('handles confirm upload failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://presigned.example.com',
            fileKey: 'files/test.txt',
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true, // R2 upload success
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({
            error: 'Database error',
          }),
        })

      const result = await uploadFile(mockFile, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('handles network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await uploadFile(mockFile, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Upload failed due to network error')
    })

    it('validates files before upload', async () => {
      const invalidFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain',
      })

      const result = await uploadFile(invalidFile, mockOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File size must be less than')
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('uploadMultipleFiles', () => {
    it('uploads multiple files', async () => {
      const files = [
        new File(['content1'], 'test1.txt', { type: 'text/plain' }),
        new File(['content2'], 'test2.txt', { type: 'text/plain' }),
      ]
      const options = { chatId: 'chat-1' }

      // Mock successful uploads
      ;(global.fetch as jest.Mock)
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://presigned.example.com',
            fileKey: 'files/test.txt',
            metadata: {},
          }),
        })
        .mockResolvedValue({ ok: true })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            file: { id: 'file-1', filename: 'test.txt' },
          }),
        })

      const results = await uploadMultipleFiles(files, options)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })
  })

  describe('Utility functions', () => {
    describe('formatFileSize', () => {
      it('formats bytes correctly', () => {
        expect(formatFileSize(0)).toBe('0 Bytes')
        expect(formatFileSize(1024)).toBe('1 KB')
        expect(formatFileSize(1024 * 1024)).toBe('1 MB')
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      })

      it('handles decimal places', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB')
        expect(formatFileSize(1048576 + 524288)).toBe('1.5 MB')
      })
    })

    describe('getFileCategory', () => {
      it('categorizes file types correctly', () => {
        expect(getFileCategory('image/jpeg')).toBe('image')
        expect(getFileCategory('image/png')).toBe('image')
        expect(getFileCategory('audio/mpeg')).toBe('audio')
        expect(getFileCategory('video/mp4')).toBe('video')
        expect(getFileCategory('application/pdf')).toBe('document')
        expect(getFileCategory('text/plain')).toBe('document')
        expect(getFileCategory('application/octet-stream')).toBe('other')
      })
    })
  })
})