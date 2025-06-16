'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Square, Paperclip, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStop,
}: ChatInputProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      handleSubmit(e);
      // Clear attachments after sending
      setAttachments([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
            >
              {file.type.startsWith('image/') ? (
                <Image className="w-4 h-4" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
              <span className="truncate max-w-32">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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
          disabled={!isLoading && !input.trim() && attachments.length === 0}
          className={cn(
            'px-4 py-3 min-w-[52px]',
            isLoading && 'bg-red-500 hover:bg-red-600'
          )}
        >
          {isLoading ? (
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
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}