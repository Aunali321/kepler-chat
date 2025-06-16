'use client';

import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';

interface LoadingIndicatorProps {
  onStop: () => void;
}

export function LoadingIndicator({ onStop }: LoadingIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
        
        <span className="text-sm text-gray-600">
          AI is typing...
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onStop}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Square className="w-3 h-3 mr-1" />
        Stop
      </Button>
    </div>
  );
}