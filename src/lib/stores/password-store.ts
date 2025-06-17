import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface PasswordFieldState {
  fieldVisibility: Record<string, boolean>;
  
  // Actions
  toggleVisibility: (fieldId: string) => void;
  setVisibility: (fieldId: string, visible: boolean) => void;
  clearField: (fieldId: string) => void;
  clearAllFields: () => void;
  
  // Getters
  isVisible: (fieldId: string) => boolean;
}

export const usePasswordStore = create<PasswordFieldState>()(
  immer((set, get) => ({
    fieldVisibility: {},

    toggleVisibility: (fieldId) => {
      set((state) => {
        state.fieldVisibility[fieldId] = !state.fieldVisibility[fieldId];
      });
    },

    setVisibility: (fieldId, visible) => {
      set((state) => {
        state.fieldVisibility[fieldId] = visible;
      });
    },

    clearField: (fieldId) => {
      set((state) => {
        delete state.fieldVisibility[fieldId];
      });
    },

    clearAllFields: () => {
      set((state) => {
        state.fieldVisibility = {};
      });
    },

    isVisible: (fieldId) => {
      return get().fieldVisibility[fieldId] || false;
    },
  }))
);

// Custom hook for password field management
export const usePasswordField = (fieldId: string) => {
  const { toggleVisibility, setVisibility, isVisible } = usePasswordStore();

  return {
    isVisible: isVisible(fieldId),
    toggle: () => toggleVisibility(fieldId),
    show: () => setVisibility(fieldId, true),
    hide: () => setVisibility(fieldId, false),
  };
};