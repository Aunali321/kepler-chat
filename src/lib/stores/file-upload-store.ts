import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  fileId?: string; // Database file ID once confirmed
  url?: string; // Final file URL
}

export interface FileUploadState {
  // Current uploads
  uploadingFiles: Record<string, UploadingFile>;
  
  // Upload statistics
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  
  // UI state
  showUploadProgress: boolean;
  isUploading: boolean;
  
  // Actions
  startUpload: (file: File) => string; // Returns upload ID
  updateProgress: (uploadId: string, progress: number) => void;
  setStatus: (uploadId: string, status: UploadingFile['status'], error?: string) => void;
  completeUpload: (uploadId: string, fileId: string, url: string) => void;
  removeUpload: (uploadId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  
  // Bulk actions
  cancelAllUploads: () => void;
  retryFailedUploads: () => void;
  
  // UI actions
  setShowUploadProgress: (show: boolean) => void;
  
  // Selectors
  getActiveUploads: () => UploadingFile[];
  getCompletedUploads: () => UploadingFile[];
  getFailedUploads: () => UploadingFile[];
  getUploadById: (uploadId: string) => UploadingFile | undefined;
}

export const useFileUploadStore = create<FileUploadState>()(
  immer((set, get) => ({
    // Initial state
    uploadingFiles: {},
    totalUploads: 0,
    completedUploads: 0,
    failedUploads: 0,
    showUploadProgress: false,
    isUploading: false,

    // Start a new upload
    startUpload: (file: File) => {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      set((state) => {
        state.uploadingFiles[uploadId] = {
          id: uploadId,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending',
        };
        
        state.totalUploads++;
        state.isUploading = true;
        state.showUploadProgress = true;
      });
      
      return uploadId;
    },

    // Update upload progress
    updateProgress: (uploadId, progress) => {
      set((state) => {
        const upload = state.uploadingFiles[uploadId];
        if (upload) {
          upload.progress = Math.max(0, Math.min(100, progress));
          if (upload.progress > 0 && upload.status === 'pending') {
            upload.status = 'uploading';
          }
        }
      });
    },

    // Set upload status
    setStatus: (uploadId, status, error) => {
      set((state) => {
        const upload = state.uploadingFiles[uploadId];
        if (upload) {
          upload.status = status;
          if (error) {
            upload.error = error;
          }
          
          // Update counters
          if (status === 'completed') {
            state.completedUploads++;
          } else if (status === 'error') {
            state.failedUploads++;
          }
          
          // Check if all uploads are done
          const activeUploads = Object.values(state.uploadingFiles).filter(
            u => u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
          );
          state.isUploading = activeUploads.length > 0;
        }
      });
    },

    // Complete an upload
    completeUpload: (uploadId, fileId, url) => {
      set((state) => {
        const upload = state.uploadingFiles[uploadId];
        if (upload) {
          upload.status = 'completed';
          upload.progress = 100;
          upload.fileId = fileId;
          upload.url = url;
          state.completedUploads++;
          
          // Check if all uploads are done
          const activeUploads = Object.values(state.uploadingFiles).filter(
            u => u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
          );
          state.isUploading = activeUploads.length > 0;
        }
      });
    },

    // Remove a specific upload
    removeUpload: (uploadId) => {
      set((state) => {
        const upload = state.uploadingFiles[uploadId];
        if (upload) {
          // Update counters
          if (upload.status === 'completed') {
            state.completedUploads--;
          } else if (upload.status === 'error') {
            state.failedUploads--;
          }
          state.totalUploads--;
          
          delete state.uploadingFiles[uploadId];
          
          // Update isUploading state
          const activeUploads = Object.values(state.uploadingFiles).filter(
            u => u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
          );
          state.isUploading = activeUploads.length > 0;
        }
      });
    },

    // Clear completed uploads
    clearCompleted: () => {
      set((state) => {
        const completed = Object.entries(state.uploadingFiles).filter(
          ([_uploadId, upload]) => upload.status === 'completed'
        );
        
        completed.forEach(([uploadId, _upload]) => {
          delete state.uploadingFiles[uploadId];
          state.completedUploads--;
          state.totalUploads--;
        });
      });
    },

    // Clear all uploads
    clearAll: () => {
      set((state) => {
        state.uploadingFiles = {};
        state.totalUploads = 0;
        state.completedUploads = 0;
        state.failedUploads = 0;
        state.isUploading = false;
        state.showUploadProgress = false;
      });
    },

    // Cancel all active uploads
    cancelAllUploads: () => {
      set((state) => {
        Object.values(state.uploadingFiles).forEach(upload => {
          if (upload.status === 'pending' || upload.status === 'uploading') {
            upload.status = 'error';
            upload.error = 'Upload cancelled';
            state.failedUploads++;
          }
        });
        state.isUploading = false;
      });
    },

    // Retry failed uploads
    retryFailedUploads: () => {
      set((state) => {
        Object.values(state.uploadingFiles).forEach(upload => {
          if (upload.status === 'error') {
            upload.status = 'pending';
            upload.progress = 0;
            upload.error = undefined;
            state.failedUploads--;
          }
        });
        
        const hasRetryable = Object.values(state.uploadingFiles).some(
          u => u.status === 'pending'
        );
        if (hasRetryable) {
          state.isUploading = true;
        }
      });
    },

    // UI actions
    setShowUploadProgress: (show) => {
      set((state) => {
        state.showUploadProgress = show;
      });
    },

    // Selectors
    getActiveUploads: () => {
      const state = get();
      return Object.values(state.uploadingFiles).filter(
        upload => upload.status === 'pending' || upload.status === 'uploading' || upload.status === 'processing'
      );
    },

    getCompletedUploads: () => {
      const state = get();
      return Object.values(state.uploadingFiles).filter(
        upload => upload.status === 'completed'
      );
    },

    getFailedUploads: () => {
      const state = get();
      return Object.values(state.uploadingFiles).filter(
        upload => upload.status === 'error'
      );
    },

    getUploadById: (uploadId) => {
      const state = get();
      return state.uploadingFiles[uploadId];
    },
  }))
);

// Helper hook for upload statistics
export const useUploadStats = () => {
  const {
    totalUploads,
    completedUploads,
    failedUploads,
    isUploading,
    getActiveUploads,
  } = useFileUploadStore();

  const activeUploads = getActiveUploads().length;
  const overallProgress = totalUploads > 0 ? Math.round((completedUploads / totalUploads) * 100) : 0;

  return {
    totalUploads,
    completedUploads,
    failedUploads,
    activeUploads,
    isUploading,
    overallProgress,
  };
};