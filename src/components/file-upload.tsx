"use client";

import { useCallback, useState } from 'react';
import { Upload, X, File, Image, FileText, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  uploadFile,
  uploadMultipleFiles,
  validateFileClient,
  formatFileSize,
  getFileCategory,
  type FileUploadResult,
  type FileUploadOptions
} from '@/lib/file-upload';
import { useFileUpload } from '@/lib/stores/file-upload-store';
import { useNotify } from '@/lib/stores/notification-store';

interface FileUploadProps {
  onFilesUploaded?: (results: FileUploadResult[]) => void;
  onError?: (error: string) => void;
  options: FileUploadOptions;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export function FileUpload({
  onFilesUploaded,
  onError,
  options,
  multiple = true,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);

  // Use file upload store for global state
  const { isUploading, uploadProgress, addUpload, updateProgress, removeUpload } = useFileUpload();
  const notify = useNotify();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  }, [disabled]);

  const handleFiles = useCallback((files: File[]) => {
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFileClient(file);
      if (validation.valid) {
        const fileWithPreview = file as FileWithPreview;

        // Create preview for images
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        validFiles.push(fileWithPreview);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      notify.error(errorMessage);
      onError?.(errorMessage);
    }

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFiles(validFiles.slice(0, 1));
    }
  }, [multiple, onError]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];

      // Revoke preview URL to prevent memory leaks
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    // Add uploads to global store
    const uploadIds = selectedFiles.map(file =>
      addUpload({
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: 'uploading'
      })
    );

    try {
      const results = await uploadMultipleFiles(selectedFiles, options);

      // Clean up preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

      setSelectedFiles([]);

      // Update upload status in store
      uploadIds.forEach((id, index) => {
        const result = results[index];
        if (result.success) {
          updateProgress(id, 100, 'completed');
          // Remove from store after 2 seconds
          setTimeout(() => removeUpload(id), 2000);
        } else {
          updateProgress(id, 0, 'failed');
          // Remove from store after 5 seconds
          setTimeout(() => removeUpload(id), 5000);
        }
      });

      onFilesUploaded?.(results);

      // Report any upload errors
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        const errors = failedUploads.map(result => result.error).join('\n');
        notify.error(errors);
        onError?.(errors);
      } else {
        notify.success(`Successfully uploaded ${results.length} file${results.length > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = 'Failed to upload files';
      notify.error(errorMessage);
      onError?.(errorMessage);

      // Mark all uploads as failed
      uploadIds.forEach(id => {
        updateProgress(id, 0, 'failed');
        setTimeout(() => removeUpload(id), 5000);
      });
    }
  }, [selectedFiles, isUploading, options, onFilesUploaded, onError, addUpload, updateProgress, removeUpload, notify]);

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type);
    switch (category) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card
        className={`
          relative border-2 border-dashed transition-colors duration-200 cursor-pointer
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*,application/pdf,text/*,audio/*,video/*"
        />

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
          </p>
          <p className="text-xs text-gray-400">
            Max 50MB per file
          </p>
        </div>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  getFileIcon(file)
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          onClick={uploadFiles}
          disabled={isUploading || disabled}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`
          )}
        </Button>
      )}
    </div>
  );
}