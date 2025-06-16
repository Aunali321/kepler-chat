'use client';

import { cn } from '@/lib/utils';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Message } from 'ai';

interface MessageRendererProps {
  message: Message;
  isLast: boolean;
}

export function MessageRenderer({ message, isLast }: MessageRendererProps) {
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const handleCopy = async () => {
    if (typeof message.content === 'string') {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle different content types
  const renderContent = () => {
    if (typeof message.content === 'string') {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      );
    }
    
    // Handle multi-part content (e.g., with images)
    if (Array.isArray(message.content)) {
      const contentArray = message.content as any[];
      return (
        <div className="space-y-2">
          {contentArray.map((part: any, index: number) => (
            <div key={index}>
              {part.type === 'text' && (
                <div className="whitespace-pre-wrap break-words">
                  {part.text}
                </div>
              )}
              {part.type === 'image' && (
                <img 
                  src={part.image} 
                  alt="Attached image"
                  className="max-w-sm rounded-lg border"
                />
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  // Don't render system messages visually
  if (isSystem) {
    return null;
  }

  return (
    <div className={cn(
      'flex gap-3 group',
      isUser && 'flex-row-reverse'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        'flex-1 min-w-0',
        isUser && 'text-right'
      )}>
        {/* Message bubble */}
        <div className={cn(
          'inline-block max-w-[80%] p-3 rounded-lg',
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900 border'
        )}>
          {renderContent()}
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </div>

        {/* Tool invocations */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolInvocations.map((toolInvocation: any, index: number) => (
              <div 
                key={index}
                className="text-xs bg-gray-50 p-2 rounded border-l-2 border-blue-500"
              >
                <div className="font-medium">🔧 Tool: {toolInvocation.toolName}</div>
                {toolInvocation.args && (
                  <div className="text-gray-600 mt-1">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(toolInvocation.args, null, 2)}
                    </pre>
                  </div>
                )}
                {toolInvocation.result && (
                  <div className="text-gray-700 mt-1">
                    Result: {JSON.stringify(toolInvocation.result)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}