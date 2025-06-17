'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Square, Paperclip, Image, X, FileText, Music, Video } from 'lucide-react';
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
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: { experimental_attachments?: Attachment[] }) => void;
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

  // Add effect to track uploadedAttachments changes
  useEffect(() => {
    console.log('📋 uploadedAttachments changed:', uploadedAttachments);
  }, [uploadedAttachments]);

  // Add effect to track files changes
  useEffect(() => {
    console.log('📁 files changed:', files ? Array.from(files).map(f => f.name) : null);
  }, [files]);

  // Add effect to track isUploading state
  useEffect(() => {
    console.log('⏳ isUploading changed:', isUploading);
    const buttonDisabled = isUploading || (!isLoading && !input.trim() && uploadedAttachments.length === 0);
    console.log('🔒 Button disabled:', buttonDisabled, {
      isUploading,
      isLoading,
      hasInput: !!input.trim(),
      hasAttachments: uploadedAttachments.length > 0
    });
  }, [isUploading, isLoading, input, uploadedAttachments]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🔑 Enter key pressed, checking conditions:', {
        hasInput: !!input.trim(),
        isLoading,
        isUploading,
        hasAttachments: uploadedAttachments.length > 0
      });
      
      // Check same conditions as button disabled state
      if ((input.trim() || uploadedAttachments.length > 0) && !isLoading && !isUploading) {
        console.log('✅ Enter key submit allowed');
        handleSubmit(e as any);
      } else {
        console.log('❌ Enter key submit blocked');
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
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Selected files:', Array.from(fileList).map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    setFiles(fileList);
    setUploadError(null);
    setIsUploading(true);

    try {
      const attachments: Attachment[] = [];

      for (const file of Array.from(fileList)) {
        console.log(`Processing file: ${file.name} (${file.type})`);
        
        // Validate file first
        const validation = validateFileClient(file);
        console.log(`Validation result for ${file.name}:`, validation);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload to R2
        console.log(`Uploading ${file.name} to R2...`);
        const uploadResult = await uploadFile(file, { chatId });
        console.log(`Upload result for ${file.name}:`, uploadResult);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
        }

        if (uploadResult.file) {
          const attachment = {
            name: uploadResult.file.filename,
            contentType: uploadResult.file.contentType,
            url: uploadResult.file.url,
          };
          console.log(`Adding attachment for ${file.name}:`, attachment);
          attachments.push(attachment);
        }
      }

      console.log('Final attachments array:', attachments);
      setUploadedAttachments(attachments);
      console.log('✅ Upload completed, setting isUploading to false');
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
      setFiles(undefined);
      setUploadedAttachments([]);
      console.log('❌ Upload failed, setting isUploading to false');
    } finally {
      setIsUploading(false);
      console.log('🔄 isUploading finally set to false');
    }
  };

  const removeFiles = () => {
    console.log('🗑️ removeFiles called - clearing attachments');
    console.trace('removeFiles call stack');
    setFiles(undefined);
    setUploadedAttachments([]);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('=== CHAT INPUT onSubmit DEBUG ===');
    console.log('isUploading:', isUploading);
    console.log('input.trim():', input.trim());
    console.log('uploadedAttachments:', uploadedAttachments);
    console.log('uploadedAttachments.length:', uploadedAttachments.length);
    console.log('Current form event:', e.type);

    // Don't submit if still uploading
    if (isUploading) {
      console.log('❌ Blocked: Still uploading');
      return;
    }

    if (input.trim() || uploadedAttachments.length > 0) {
      console.log('✅ Submitting with uploadedAttachments:', uploadedAttachments);

      // Call handleSubmit with proper options object
      const submitOptions = uploadedAttachments.length > 0 ? {
        experimental_attachments: uploadedAttachments,
      } : undefined;
      
      console.log('📤 Final submit options:', submitOptions);
      handleSubmit(e, submitOptions);

      // Clear files after sending
      console.log('🧹 Clearing files after submit');
      setFiles(undefined);
      setUploadedAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      console.log('❌ Blocked: No input and no attachments');
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
              if (contentType.startsWith('video/')) return <Video className="w-4 h-4" />;
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
      <form 
        onSubmit={(e) => {
          console.log('📋 Form onSubmit triggered!');
          onSubmit(e);
        }} 
        className="flex gap-3"
      >
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
            onClick={() => {
              console.log('📎 File attachment button clicked');
              fileInputRef.current?.click();
            }}
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
          onClick={(e) => {
            console.log('🚀 Send button clicked!', { isLoading, type: isLoading ? 'button' : 'submit' });
            if (isLoading) {
              console.log('🛑 Calling onStop');
              onStop();
            } else {
              console.log('📝 Submit button - should trigger form onSubmit');
            }
          }}
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