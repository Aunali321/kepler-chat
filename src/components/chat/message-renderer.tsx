'use client';

import { cn } from '@/lib/utils';
import { User, Bot, Copy, Check, FileText, Music, Video } from 'lucide-react';
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

        {/* Experimental attachments */}
        {(message as any).experimental_attachments && (message as any).experimental_attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {(message as any).experimental_attachments
              .filter((attachment: any) => 
                attachment?.contentType?.startsWith('image/') ||
                attachment?.contentType?.startsWith('application/pdf') ||
                attachment?.contentType?.startsWith('audio/') ||
                attachment?.contentType?.startsWith('video/') ||
                attachment?.contentType?.startsWith('text/')
              )
              .map((attachment: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  {attachment.contentType?.startsWith('image/') && (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name || 'Attached image'}
                      className="max-w-sm rounded-lg"
                    />
                  )}
                  {attachment.contentType === 'application/pdf' && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium">{attachment.name}</span>
                    </div>
                  )}
                  {attachment.contentType?.startsWith('audio/') && (
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">{attachment.name}</span>
                    </div>
                  )}
                  {attachment.contentType?.startsWith('video/') && (
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">{attachment.name}</span>
                    </div>
                  )}
                  {attachment.contentType?.startsWith('text/') && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Tool invocations */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolInvocations.map((toolInvocation: any, index: number) => {
              const getToolIcon = (toolName: string) => {
                const icons: Record<string, string> = {
                  calculator: '🧮',
                  weather: '🌤️',
                  webSearch: '🔍',
                  codeExecutor: '💻',
                  urlFetch: '🌐',
                };
                return icons[toolName] || '🔧';
              };

              const isCompleted = toolInvocation.state === 'result' || toolInvocation.result;
              const isRunning = toolInvocation.state === 'call' && !toolInvocation.result;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    'border rounded-lg p-3 text-sm',
                    isCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {isRunning && (
                      <div className="w-3 h-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    )}
                    <span>{getToolIcon(toolInvocation.toolName)}</span>
                    <span className="capitalize">
                      {toolInvocation.toolName?.replace(/([A-Z])/g, ' $1').trim() || 'Tool'}
                    </span>
                    {isCompleted && <span className="text-green-600 text-xs">✓ Completed</span>}
                    {isRunning && <span className="text-blue-600 text-xs">Running...</span>}
                  </div>
                  
                  {toolInvocation.args && (
                    <div className="mt-2 text-gray-600">
                      <div className="text-xs font-medium mb-1">Parameters:</div>
                      <div className="bg-white rounded p-2 border">
                        {Object.entries(toolInvocation.args).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-xs">
                            <span className="font-medium text-gray-500">{key}:</span>
                            <span className="text-gray-700">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {toolInvocation.result && (
                    <div className="mt-2">
                      <div className="text-xs font-medium mb-1 text-green-700">Result:</div>
                      <div className="bg-white rounded p-2 border">
                        {typeof toolInvocation.result === 'object' ? (
                          toolInvocation.result.summary ? (
                            <div className="text-sm text-gray-700">{toolInvocation.result.summary}</div>
                          ) : (
                            <pre className="text-xs overflow-x-auto text-gray-700">
                              {JSON.stringify(toolInvocation.result, null, 2)}
                            </pre>
                          )
                        ) : (
                          <div className="text-sm text-gray-700">{String(toolInvocation.result)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}