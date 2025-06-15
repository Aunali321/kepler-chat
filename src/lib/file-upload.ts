"use client";

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './r2-storage';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResult {
  success: boolean;
  file?: {
    id: string;
    filename: string;
    url: string;
    contentType: string;
    size: number;
    uploadedAt: string;
  };
  error?: string;
}

export interface FileUploadOptions {
  chatId: string; // Required for our schema
  messageId?: string;
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  try {
    // Validate file on client side
    const validation = validateFileClient(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Step 1: Get presigned upload URL
    const uploadUrlResponse = await fetch('/api/files/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        chatId: options.chatId,
      }),
    });

    if (!uploadUrlResponse.ok) {
      const error = await uploadUrlResponse.json();
      return { success: false, error: error.error || 'Failed to get upload URL' };
    }

    const { uploadUrl, fileKey, metadata } = await uploadUrlResponse.json();

    // Step 2: Upload file directly to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      return { success: false, error: 'Failed to upload file to storage' };
    }

    // Step 3: Confirm upload and save metadata
    const confirmResponse = await fetch('/api/files/confirm-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        chatId: options.chatId,
        messageId: options.messageId,
      }),
    });

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      return { success: false, error: error.error || 'Failed to confirm upload' };
    }

    const result = await confirmResponse.json();
    return { success: true, file: result.file };

  } catch (error) {
    console.error('File upload error:', error);
    return { success: false, error: 'Upload failed due to network error' };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: FileUploadOptions
): Promise<FileUploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, options))
  );
  return results;
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to delete file' };
    }

    return { success: true };
  } catch (error) {
    console.error('File deletion error:', error);
    return { success: false, error: 'Deletion failed due to network error' };
  }
}

/**
 * Client-side file validation
 */
export function validateFileClient(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES).join(', ');
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes}`
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type category for display
 */
export function getFileCategory(contentType: string): 'image' | 'document' | 'audio' | 'video' | 'other' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  if ([
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ].includes(contentType)) return 'document';
  
  return 'other';
}

/**
 * Check if file can be previewed in browser
 */
export function canPreviewFile(contentType: string): boolean {
  return (
    contentType.startsWith('image/') ||
    contentType === 'application/pdf' ||
    contentType.startsWith('text/') ||
    contentType === 'application/json'
  );
}