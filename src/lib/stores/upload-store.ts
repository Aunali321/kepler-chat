import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  fileId?: string;
  url?: string;
  chatId?: string;
}

export interface UploadNotification {
  id: string;
  type: 'upload_progress' | 'upload_complete' | 'upload_error';
  title: string;
  message?: string;
  uploadId?: string;
  timestamp: number;
  autoRemove?: boolean;
}

export interface UploadState {
  // Active uploads
  uploads: Record<string, Upload>;
  
  // Upload notifications
  notifications: UploadNotification[];
  
  // UI state
  showProgress: boolean;
  
  // Actions
  startUpload: (file: File, chatId?: string) => string;
  updateProgress: (uploadId: string, progress: number) => void;
  completeUpload: (uploadId: string, fileId: string, url: string) => void;
  failUpload: (uploadId: string, error: string) => void;
  removeUpload: (uploadId: string) => void;
  
  // Notification actions
  addNotification: (notification: Omit<UploadNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // UI actions
  setShowProgress: (show: boolean) => void;
  
  // Getters
  getActiveUploads: () => Upload[];
  getUploadById: (uploadId: string) => Upload | undefined;
  getTotalProgress: () => number;
  isUploading: () => boolean;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useUploadStore = create<UploadState>()(
  immer((set, get) => ({
    // Initial state
    uploads: {},
    notifications: [],
    showProgress: false,

    // Start a new upload
    startUpload: (file, chatId) => {
      const uploadId = `upload-${generateId()}`;
      
      set((state) => {
        state.uploads[uploadId] = {
          id: uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          progress: 0,
          status: 'pending',
          chatId,
        };
        state.showProgress = true;
      });

      // Add notification
      get().addNotification({
        type: 'upload_progress',
        title: 'Upload Started',
        message: `Uploading ${file.name}`,
        uploadId,
        autoRemove: false,
      });
      
      return uploadId;
    },

    // Update upload progress
    updateProgress: (uploadId, progress) => {
      set((state) => {
        const upload = state.uploads[uploadId];
        if (upload) {
          upload.progress = Math.max(0, Math.min(100, progress));
          if (upload.progress > 0 && upload.status === 'pending') {
            upload.status = 'uploading';
          }
        }
      });
    },

    // Complete an upload
    completeUpload: (uploadId, fileId, url) => {
      set((state) => {
        const upload = state.uploads[uploadId];
        if (upload) {
          upload.status = 'completed';
          upload.progress = 100;
          upload.fileId = fileId;
          upload.url = url;
        }
      });

      const upload = get().uploads[uploadId];
      if (upload) {
        get().addNotification({
          type: 'upload_complete',
          title: 'Upload Complete',
          message: `${upload.fileName} uploaded successfully`,
          uploadId,
          autoRemove: true,
        });
      }

      // Auto-remove completed upload after 30 seconds
      setTimeout(() => {
        get().removeUpload(uploadId);
      }, 30000);
    },

    // Fail an upload
    failUpload: (uploadId, error) => {
      set((state) => {
        const upload = state.uploads[uploadId];
        if (upload) {
          upload.status = 'error';
          upload.error = error;
        }
      });

      const upload = get().uploads[uploadId];
      if (upload) {
        get().addNotification({
          type: 'upload_error',
          title: 'Upload Failed',
          message: `${upload.fileName}: ${error}`,
          uploadId,
          autoRemove: false,
        });
      }
    },

    // Remove an upload
    removeUpload: (uploadId) => {
      set((state) => {
        delete state.uploads[uploadId];
        
        // Remove related notifications
        state.notifications = state.notifications.filter(
          n => n.uploadId !== uploadId
        );
        
        // Hide progress if no active uploads
        const hasActiveUploads = Object.values(state.uploads).some(
          u => u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
        );
        if (!hasActiveUploads) {
          state.showProgress = false;
        }
      });
    },

    // Add notification
    addNotification: (notification) => {
      const id = `notif-${generateId()}`;
      const newNotification: UploadNotification = {
        id,
        timestamp: Date.now(),
        ...notification,
      };

      set((state) => {
        state.notifications.unshift(newNotification);
        
        // Keep only last 10 notifications
        if (state.notifications.length > 10) {
          state.notifications = state.notifications.slice(0, 10);
        }
      });

      // Auto-remove if specified
      if (notification.autoRemove) {
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      }
    },

    // Remove notification
    removeNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter(n => n.id !== id);
      });
    },

    // Clear all notifications
    clearNotifications: () => {
      set((state) => {
        state.notifications = [];
      });
    },

    // Set show progress
    setShowProgress: (show) => {
      set((state) => {
        state.showProgress = show;
      });
    },

    // Get active uploads
    getActiveUploads: () => {
      const state = get();
      return Object.values(state.uploads).filter(
        upload => upload.status === 'pending' || upload.status === 'uploading' || upload.status === 'processing'
      );
    },

    // Get upload by ID
    getUploadById: (uploadId) => {
      return get().uploads[uploadId];
    },

    // Get total progress
    getTotalProgress: () => {
      const uploads = Object.values(get().uploads);
      if (uploads.length === 0) return 0;
      
      const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
      return Math.round(totalProgress / uploads.length);
    },

    // Check if uploading
    isUploading: () => {
      return get().getActiveUploads().length > 0;
    },
  }))
);

// Helper hooks
export const useUploads = () => {
  const { uploads, getActiveUploads, getTotalProgress, isUploading } = useUploadStore();
  return {
    uploads: Object.values(uploads),
    activeUploads: getActiveUploads(),
    totalProgress: getTotalProgress(),
    isUploading: isUploading(),
  };
};

export const useUploadNotifications = () => {
  const { notifications, removeNotification, clearNotifications } = useUploadStore();
  return {
    notifications,
    removeNotification,
    clearNotifications,
  };
};