import { useCallback } from 'react';
import { useFileUploadStore, type UploadingFile } from '@/lib/stores/file-upload-store';

export interface UseFileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  autoUpload?: boolean;
  onComplete?: (file: UploadingFile) => void;
  onError?: (error: string, file?: UploadingFile) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = [
      'image/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/*',
      'video/*',
    ],
    autoUpload = true,
    onComplete,
    onError,
  } = options;

  const {
    startUpload,
    updateProgress,
    setStatus,
    completeUpload,
    removeUpload,
    getUploadById,
  } = useFileUploadStore();

  const validateFile = useCallback((file: File): string | null => {
    // Size validation
    if (file.size > maxSize) {
      return `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds maximum allowed size (${Math.round(maxSize / (1024 * 1024))}MB)`;
    }

    // Type validation
    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.slice(0, -2);
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  }, [maxSize, allowedTypes]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError);
      return null;
    }

    // Start upload in store
    const uploadId = startUpload(file);

    try {
      // Step 1: Get presigned URL
      setStatus(uploadId, 'uploading');
      updateProgress(uploadId, 10);

      const uploadUrlResponse = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileId } = await uploadUrlResponse.json();
      updateProgress(uploadId, 20);

      // Step 2: Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      updateProgress(uploadId, 80);
      setStatus(uploadId, 'processing');

      // Step 3: Confirm upload
      const confirmResponse = await fetch('/api/files/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const { file: _savedFile } = await confirmResponse.json();
      updateProgress(uploadId, 100);

      // Complete upload
      const finalUrl = `/api/files/${fileId}`;
      completeUpload(uploadId, fileId, finalUrl);

      const upload = getUploadById(uploadId);
      if (upload) {
        onComplete?.(upload);
      }

      return fileId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setStatus(uploadId, 'error', errorMessage);
      
      const upload = getUploadById(uploadId);
      onError?.(errorMessage, upload);
      
      return null;
    }
  }, [
    validateFile,
    startUpload,
    updateProgress,
    setStatus,
    completeUpload,
    getUploadById,
    onComplete,
    onError,
  ]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<(string | null)[]> => {
    const uploadPromises = files.map(file => uploadFile(file));
    return Promise.all(uploadPromises);
  }, [uploadFile]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (autoUpload) {
      uploadMultipleFiles(files);
    }

    // Clear the input
    event.target.value = '';
  }, [autoUpload, uploadMultipleFiles]);

  const handleFileDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    if (autoUpload) {
      uploadMultipleFiles(files);
    }
  }, [autoUpload, uploadMultipleFiles]);

  return {
    uploadFile,
    uploadMultipleFiles,
    validateFile,
    handleFileSelect,
    handleFileDrop,
    removeUpload,
  };
};