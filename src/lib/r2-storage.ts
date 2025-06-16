import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 client configuration (compatible with S3 API)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // Your R2 custom domain or public URL

// File type validation
export const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg', '.opus'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Generate a unique file key for R2 storage
 */
export function generateFileKey(userId: string, originalFilename: string, chatId?: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop()?.toLowerCase() || '';
  
  const basePath = chatId ? `chats/${chatId}` : 'uploads';
  return `${basePath}/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Validate file type and size
 */
export function validateFile(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  return { valid: true };
}

/**
 * Generate presigned URL for file upload
 */
export async function getPresignedUploadUrl(
  key: string, 
  contentType: string,
  expiresIn: number = 600 // 10 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    // Add metadata for better file management
    Metadata: {
      'uploaded-at': new Date().toISOString(),
    },
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate presigned URL for file download (for private files)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Get public URL for a file (if using custom domain/public bucket)
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Extract file info from upload
 */
export function extractFileInfo(file: File) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified),
  };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith('image/');
}

/**
 * Check if file is a document
 */
export function isDocumentFile(contentType: string): boolean {
  return [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ].includes(contentType);
}

/**
 * Check if file is audio
 */
export function isAudioFile(contentType: string): boolean {
  return contentType.startsWith('audio/');
}

/**
 * Check if file is video
 */
export function isVideoFile(contentType: string): boolean {
  return contentType.startsWith('video/');
}