import { useState, useEffect } from 'react';

// Simple toast utility to replace complex notification store
// This provides basic toast functionality without the overhead

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  action?: ToastOptions['action'];
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private nextId = 1;

  private generateId(): string {
    return `toast-${this.nextId++}`;
  }

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private addToast(type: ToastType, title: string, description?: string, options: ToastOptions = {}): string {
    const id = this.generateId();
    const duration = options.duration ?? (type === 'error' ? 0 : 5000);
    
    const toast: Toast = {
      id,
      type,
      title,
      description,
      duration,
      action: options.action,
    };

    this.toasts.unshift(toast);
    
    // Keep only last 5 toasts
    if (this.toasts.length > 5) {
      this.toasts = this.toasts.slice(0, 5);
    }

    this.notify();

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  public success(title: string, description?: string, options?: ToastOptions): string {
    return this.addToast('success', title, description, options);
  }

  public error(title: string, description?: string, options?: ToastOptions): string {
    return this.addToast('error', title, description, { ...options, duration: 0 });
  }

  public warning(title: string, description?: string, options?: ToastOptions): string {
    return this.addToast('warning', title, description, options);
  }

  public info(title: string, description?: string, options?: ToastOptions): string {
    return this.addToast('info', title, description, options);
  }

  public dismiss(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  public dismissAll(): void {
    this.toasts = [];
    this.notify();
  }

  public subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getToasts(): Toast[] {
    return [...this.toasts];
  }

  // Promise helper for async operations
  public async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ): Promise<T> {
    const loadingId = this.info(messages.loading, undefined, { duration: 0 });

    try {
      const result = await promise;
      
      this.dismiss(loadingId);
      
      const successMessage = typeof messages.success === 'function' 
        ? messages.success(result) 
        : messages.success;
      this.success(successMessage, undefined, options);
      
      return result;
    } catch (error) {
      this.dismiss(loadingId);
      
      const errorMessage = typeof messages.error === 'function' 
        ? messages.error(error as Error) 
        : messages.error;
      this.error(errorMessage, undefined, options);
      
      throw error;
    }
  }
}

// Create singleton instance
const toastManager = new ToastManager();

// Export the main toast interface
export const toast = {
  success: toastManager.success.bind(toastManager),
  error: toastManager.error.bind(toastManager),
  warning: toastManager.warning.bind(toastManager),
  info: toastManager.info.bind(toastManager),
  dismiss: toastManager.dismiss.bind(toastManager),
  dismissAll: toastManager.dismissAll.bind(toastManager),
  promise: toastManager.promise.bind(toastManager),
};

// Hook for React components to subscribe to toast updates
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    setToasts(toastManager.getToasts());
    return unsubscribe;
  }, []);

  return {
    toasts,
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll,
  };
}