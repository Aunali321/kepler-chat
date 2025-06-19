'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useToasts, type ToastType } from '@/lib/toast';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconProps = { className: 'w-5 h-5 flex-shrink-0' };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="w-5 h-5 flex-shrink-0 text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="w-5 h-5 flex-shrink-0 text-red-500" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="w-5 h-5 flex-shrink-0 text-yellow-500" />;
    case 'info':
      return <Info {...iconProps} className="w-5 h-5 flex-shrink-0 text-blue-500" />;
    case 'loading':
      return <Loader2 {...iconProps} className="w-5 h-5 flex-shrink-0 text-blue-500 animate-spin" />;
    default:
      return <Info {...iconProps} className="w-5 h-5 flex-shrink-0 text-gray-500" />;
  }
};

const ToastItem = ({ toast, onRemove }: { toast: any; onRemove: (id: string) => void }) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    loading: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  }[toast.type] || 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm ${bgColor} animate-in slide-in-from-right-full duration-300`}>
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toast.action.onClick}
              className="text-xs"
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(toast.id)}
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function NotificationProvider() {
  const { toasts, dismiss } = useToasts();
  const { preferences: { notificationSettings } } = useAppStore();

  // Filter toasts based on user preferences
  const filteredToasts = toasts.filter(toast => {
    const settings = notificationSettings || {};
    
    // Check notification type preferences
    if (toast.type === 'info' && !settings.chatNotifications) {
      return false;
    }
    
    return true; // Show by default
  });

  // Handle escape key to dismiss toasts
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && filteredToasts.length > 0) {
        // Remove the most recent toast
        dismiss(filteredToasts[0].id);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [filteredToasts, dismiss]);

  if (filteredToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {filteredToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={dismiss}
        />
      ))}
    </div>
  );
}

// Keep backward compatibility
export { NotificationProvider as ToastProvider };