import { uploadFile, validateFileClient, type FileUploadResult } from './file-upload';

export interface ProcessedFile {
  name: string;
  contentType: string;
  url: string;
  size: number;
  fileId: string;
}

// Supported file types for multi-modal AI
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'],
  code: ['application/json', 'application/xml', 'text/html', 'text/css', 'text/javascript', 'text/typescript', 'text/python'],
} as const;

export const MAX_FILE_SIZES = {
  images: 20 * 1024 * 1024, // 20MB
  documents: 50 * 1024 * 1024, // 50MB
  audio: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
  code: 5 * 1024 * 1024, // 5MB
} as const;

export function validateFileType(file: File): boolean {
  const allSupportedTypes = [
    ...SUPPORTED_FILE_TYPES.images,
    ...SUPPORTED_FILE_TYPES.documents,
    ...SUPPORTED_FILE_TYPES.audio,
    ...SUPPORTED_FILE_TYPES.video,
    ...SUPPORTED_FILE_TYPES.code,
  ];
  
  return allSupportedTypes.includes(file.type as any);
}

export function validateFileSize(file: File): boolean {
  if (SUPPORTED_FILE_TYPES.images.includes(file.type as any)) {
    return file.size <= MAX_FILE_SIZES.images;
  }
  if (SUPPORTED_FILE_TYPES.documents.includes(file.type as any)) {
    return file.size <= MAX_FILE_SIZES.documents;
  }
  if (SUPPORTED_FILE_TYPES.audio.includes(file.type as any)) {
    return file.size <= MAX_FILE_SIZES.audio;
  }
  if (SUPPORTED_FILE_TYPES.video.includes(file.type as any)) {
    return file.size <= MAX_FILE_SIZES.video;
  }
  if (SUPPORTED_FILE_TYPES.code.includes(file.type as any)) {
    return file.size <= MAX_FILE_SIZES.code;
  }
  return false;
}

export function getFileCategory(file: File): string {
  if (SUPPORTED_FILE_TYPES.images.includes(file.type as any)) return 'image';
  if (SUPPORTED_FILE_TYPES.documents.includes(file.type as any)) return 'document';
  if (SUPPORTED_FILE_TYPES.audio.includes(file.type as any)) return 'audio';
  if (SUPPORTED_FILE_TYPES.video.includes(file.type as any)) return 'video';
  if (SUPPORTED_FILE_TYPES.code.includes(file.type as any)) return 'code';
  return 'unknown';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported`,
    };
  }
  
  if (!validateFileSize(file)) {
    const category = getFileCategory(file);
    const maxSize = MAX_FILE_SIZES[category as keyof typeof MAX_FILE_SIZES] || MAX_FILE_SIZES.images;
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum ${(maxSize / 1024 / 1024)}MB for ${category} files`,
    };
  }
  
  return { valid: true };
}

export async function processFileForChat(file: File, chatId: string): Promise<ProcessedFile> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  try {
    // Upload file using existing upload function
    const uploadResult = await uploadFile(file, { chatId });
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }
    
    if (!uploadResult.file) {
      throw new Error('Upload succeeded but no file metadata returned');
    }
    
    return {
      name: uploadResult.file.filename,
      contentType: uploadResult.file.contentType,
      url: uploadResult.file.url,
      size: uploadResult.file.size,
      fileId: uploadResult.file.id,
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processMultipleFiles(files: File[], chatId: string): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    try {
      const processedFile = await processFileForChat(file, chatId);
      results.push(processedFile);
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All files failed to process:\n${errors.join('\n')}`);
  }
  
  if (errors.length > 0) {
    console.warn(`Some files failed to process:\n${errors.join('\n')}`);
  }
  
  return results;
}

// Convert processed files to the format expected by experimental_attachments
export function toAttachments(processedFiles: ProcessedFile[]) {
  return processedFiles.map(file => ({
    name: file.name,
    contentType: file.contentType,
    url: file.url,
  }));
}