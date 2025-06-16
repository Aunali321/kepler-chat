'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Square, Paperclip, Image, X, FileText, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile, validateFileClient } from '@/lib/file-upload';

interface Attachment {
  name: string;
  contentType: string;
  url: string;
}

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: { experimental_attachments?: FileList | Attachment[] }) => void;
  isLoading: boolean;
  onStop: () => void;
  chatId?: string;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
  chatId,
}: ChatInputProps) {
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as any);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    if (!chatId) {
      setUploadError('Chat ID not available. Please refresh the page.');
      return;
    }

    const fileList = e.target.files;
    setFiles(fileList);
    setUploadError(null);
    setIsUploading(true);

    try {
      const attachments: Attachment[] = [];

      for (const file of Array.from(fileList)) {
        // Validate file first
        const validation = validateFileClient(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload to R2
        const uploadResult = await uploadFile(file, { chatId });
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
        }

        if (uploadResult.file) {
          attachments.push({
            name: uploadResult.file.filename,
            contentType: uploadResult.file.contentType,
            url: uploadResult.file.url,
          });
        }
      }

      setUploadedAttachments(attachments);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
      setFiles(undefined);
      setUploadedAttachments([]);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFiles = () => {
    setFiles(undefined);
    setUploadedAttachments([]);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Don't submit if still uploading
    if (isUploading) {
      return;
    }

    if (input.trim() || uploadedAttachments.length > 0) {
      // Since we're using R2 uploads, we need to pass the uploaded attachment URLs
      // Convert our R2 attachments to the format expected by AI SDK
      const attachmentUrls = uploadedAttachments.map(att => ({
        name: att.name,
        contentType: att.contentType, 
        url: att.url,
      }));

      handleSubmit(e, {
        experimental_attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      });

      // Clear files after sending
      setFiles(undefined);
      setUploadedAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload error */}
      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {uploadError}
        </div>
      )}

      {/* File attachments preview */}
      {(files && files.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {Array.from(files).map((file, index) => {
            const getFileIcon = (contentType: string) => {
              if (contentType.startsWith('image/')) return <Image className="w-4 h-4" />;
              if (contentType.startsWith('audio/')) return <Music className="w-4 h-4" />;
              if (contentType === 'application/pdf' || contentType.startsWith('text/')) return <FileText className="w-4 h-4" />;
              return <Paperclip className="w-4 h-4" />;
            };

            const isUploaded = index < uploadedAttachments.length;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  isUploading && !isUploaded ? 'bg-blue-50 border border-blue-200' :
                    isUploaded ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                )}
              >
                {isUploading && !isUploaded ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : isUploaded ? (
                  <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                ) : (
                  getFileIcon(file.type)
                )}
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  onClick={removeFiles}
                  className="text-gray-500 hover:text-red-500"
                  disabled={isUploading}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={onSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Shift+Enter for new line)"
            className={cn(
              'w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12',
              'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[52px] max-h-[200px]'
            )}
            rows={1}
            disabled={isLoading}
          />

          {/* File attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled={isLoading}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Send/Stop button */}
        <Button
          type={isLoading ? 'button' : 'submit'}
          onClick={isLoading ? onStop : undefined}
          disabled={
            isUploading ||
            (!isLoading && !input.trim() && uploadedAttachments.length === 0)
          }
          className={cn(
            'px-4 py-3 min-w-[52px]',
            isLoading && 'bg-red-500 hover:bg-red-600',
            isUploading && 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          {isUploading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isLoading ? (
            <Square className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,.pdf,.txt,.md,.docx,.json,.xml,.html,.css,.js,.ts,.py"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}