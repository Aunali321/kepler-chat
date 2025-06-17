'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useNotifications, type Notification, type NotificationType } from '@/lib/stores/notification-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Button } from '@/components/ui/button';

const NotificationIcon = ({ type }: { type: NotificationType }) => {
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
      return <Loader2 {...iconProps} className="w-5 h-5 flex-shrink-0 text-gray-500 animate-spin" />;
    default:
      return <Info {...iconProps} />;
  }
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { removeNotification } = useNotifications();

  const getNotificationStyles = (type: NotificationType) => {
    const baseStyles = 'relative flex items-start space-x-3 p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800`;
      case 'loading':
        return `${baseStyles} bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800`;
      default:
        return `${baseStyles} bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700`;
    }
  };

  return (
    <div className={getNotificationStyles(notification.type)}>
      <NotificationIcon type={notification.type} />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {notification.title}
        </h4>
        {notification.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.description}
          </p>
        )}
        
        {notification.action && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={notification.action.onClick}
              className="h-8 px-3 text-xs"
            >
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>

      {notification.dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export function NotificationProvider() {
  const { notifications, removeNotification } = useNotifications();
  const { notificationSettings } = useSettingsStore();

  // Filter notifications based on user preferences
  const filteredNotifications = notifications.filter(notification => {
    const settings = notificationSettings as any || {};
    
    // Check notification type preferences
    if (notification.type === 'info' && !settings.chatNotifications) {
      return false;
    }
    
    return true; // Show by default
  });

  // Handle escape key to dismiss notifications
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && filteredNotifications.length > 0) {
        const dismissibleNotifications = filteredNotifications.filter(n => n.dismissible);
        if (dismissibleNotifications.length > 0) {
          // Remove the most recent dismissible notification
          dismissibleNotifications[0] && removeNotification(dismissibleNotifications[0].id);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [filteredNotifications, removeNotification]);

  if (filteredNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full space-y-2">
      {filteredNotifications.map((notification) => (
        <div
          key={notification.id}
          className="animate-in slide-in-from-right-full fade-in duration-300"
        >
          <NotificationItem notification={notification} />
        </div>
      ))}
    </div>
  );
}