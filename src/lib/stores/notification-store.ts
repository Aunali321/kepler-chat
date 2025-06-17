import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  timestamp: number;
}

export interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  
  // Convenience methods
  success: (title: string, description?: string, options?: Partial<Notification>) => string;
  error: (title: string, description?: string, options?: Partial<Notification>) => string;
  warning: (title: string, description?: string, options?: Partial<Notification>) => string;
  info: (title: string, description?: string, options?: Partial<Notification>) => string;
  loading: (title: string, description?: string, options?: Partial<Notification>) => string;
  
  // Async operation helpers
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: Partial<Notification>
  ) => Promise<T>;
  
  // Form helpers
  formSuccess: (message?: string) => string;
  formError: (error: string | Error) => string;
  apiError: (error: unknown, fallback?: string) => string;
}

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_NOTIFICATIONS = 5;

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useNotificationStore = create<NotificationState>()(
  immer((set, get) => ({
    notifications: [],
    maxNotifications: MAX_NOTIFICATIONS,

    // Core notification management
    addNotification: (notification) => {
      const id = generateId();
      const newNotification: Notification = {
        id,
        timestamp: Date.now(),
        duration: DEFAULT_DURATION,
        dismissible: true,
        ...notification,
      };

      set((state) => {
        // Add to beginning of array (newest first)
        state.notifications.unshift(newNotification);
        
        // Remove excess notifications
        if (state.notifications.length > state.maxNotifications) {
          state.notifications = state.notifications.slice(0, state.maxNotifications);
        }
      });

      // Auto-dismiss if duration is set
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          get().removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },

    removeNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      });
    },

    clearAllNotifications: () => {
      set((state) => {
        state.notifications = [];
      });
    },

    updateNotification: (id, updates) => {
      set((state) => {
        const index = state.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          Object.assign(state.notifications[index], updates);
        }
      });
    },

    // Convenience methods
    success: (title, description, options = {}) => {
      return get().addNotification({
        type: 'success',
        title,
        description,
        duration: DEFAULT_DURATION,
        ...options,
      });
    },

    error: (title, description, options = {}) => {
      return get().addNotification({
        type: 'error',
        title,
        description,
        duration: 0, // Errors don't auto-dismiss by default
        ...options,
      });
    },

    warning: (title, description, options = {}) => {
      return get().addNotification({
        type: 'warning',
        title,
        description,
        duration: DEFAULT_DURATION * 1.5, // Warnings stay longer
        ...options,
      });
    },

    info: (title, description, options = {}) => {
      return get().addNotification({
        type: 'info',
        title,
        description,
        duration: DEFAULT_DURATION,
        ...options,
      });
    },

    loading: (title, description, options = {}) => {
      return get().addNotification({
        type: 'loading',
        title,
        description,
        duration: 0, // Loading notifications don't auto-dismiss
        dismissible: false,
        ...options,
      });
    },

    // Promise helper for async operations
    promise: async (promise, messages, options = {}) => {
      const loadingId = get().loading(messages.loading, undefined, options);

      try {
        const result = await promise;
        
        // Remove loading notification
        get().removeNotification(loadingId);
        
        // Show success
        const successMessage = typeof messages.success === 'function' 
          ? messages.success(result) 
          : messages.success;
        get().success(successMessage, undefined, options);
        
        return result;
      } catch (error) {
        // Remove loading notification
        get().removeNotification(loadingId);
        
        // Show error
        const errorMessage = typeof messages.error === 'function' 
          ? messages.error(error as Error) 
          : messages.error;
        get().error(errorMessage, undefined, options);
        
        throw error;
      }
    },

    // Form-specific helpers
    formSuccess: (message = 'Changes saved successfully') => {
      return get().success(message);
    },

    formError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      return get().error('Failed to save changes', message);
    },

    apiError: (error, fallback = 'An unexpected error occurred') => {
      let message = fallback;
      
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as any).message);
      }
      
      return get().error('Request Failed', message);
    },
  }))
);

// Convenience hooks for common patterns
export const useNotifications = () => {
  const { notifications, removeNotification, clearAllNotifications } = useNotificationStore();
  return { notifications, removeNotification, clearAllNotifications };
};

export const useNotify = () => {
  const { success, error, warning, info, loading, promise, formSuccess, formError, apiError } = useNotificationStore();
  return { success, error, warning, info, loading, promise, formSuccess, formError, apiError };
};