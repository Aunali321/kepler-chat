import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ProviderConfig, ProviderType, ModelConfig, UserCustomModel } from '@/lib/db/types';

export interface ProviderState {
  // Provider configurations
  providers: Record<ProviderType, ProviderConfig>;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;

  // Current selections
  selectedProvider: ProviderType | null;
  selectedModel: string | null;

  // Actions
  loadProviders: () => Promise<void>;
  saveApiKey: (provider: ProviderType, apiKey: string, metadata?: any) => Promise<void>;
  deleteApiKey: (provider: ProviderType) => Promise<void>;
  validateApiKey: (provider: ProviderType) => Promise<boolean>;
  updateProviderSettings: (provider: ProviderType, settings: Partial<ProviderConfig>) => Promise<void>;
  createCustomModel: (model: Omit<UserCustomModel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomModel: (modelId: string, updates: Partial<UserCustomModel>) => Promise<void>;
  deleteCustomModel: (modelId: string) => Promise<void>;
  setSelectedProvider: (provider: ProviderType | null) => void;
  setSelectedModel: (model: string | null) => void;
  getAvailableProviders: () => ProviderType[];
  getAvailableModels: (provider: ProviderType) => ModelConfig[];
}

// Initialize with empty providers
const defaultProviders: Record<ProviderType, ProviderConfig> = {
  'openai': {
    provider: 'openai',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'anthropic': {
    provider: 'anthropic',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'google': {
    provider: 'google',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'openrouter': {
    provider: 'openrouter',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'deepseek': {
    provider: 'deepseek',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'togetherai': {
    provider: 'togetherai',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'groq': {
    provider: 'groq',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  },
  'mistral': {
    provider: 'mistral',
    isEnabled: false,
    hasApiKey: false,
    apiKeyValid: false,
    availableModels: [],
    customModels: [],
  }
};

export const useProviderStore = create<ProviderState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      providers: defaultProviders,
      isLoading: false,
      isSaving: false,
      isValidating: false,
      selectedProvider: null,
      selectedModel: null,

      // Load provider configurations from server
      loadProviders: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const response = await fetch('/api/providers');
          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.providers = { ...defaultProviders, ...data.providers };
              state.isLoading = false;
            });
          } else {
            throw new Error('Failed to load providers');
          }
        } catch (error) {
          console.error('Error loading providers:', error);
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      // Save API key for a provider
      saveApiKey: async (provider, apiKey, metadata) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch('/api/user/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, apiKey, metadata }),
          });

          if (response.ok) {
            set((state) => {
              state.providers[provider].hasApiKey = true;
              state.providers[provider].apiKeyValid = false; // Will be validated separately
              state.isSaving = false;
            });

            // Reload providers to get updated state
            await get().loadProviders();
          } else {
            throw new Error('Failed to save API key');
          }
        } catch (error) {
          console.error('Error saving API key:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Delete API key for a provider
      deleteApiKey: async (provider) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch(`/api/user/api-keys?provider=${provider}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            set((state) => {
              state.providers[provider].hasApiKey = false;
              state.providers[provider].apiKeyValid = false;
              state.providers[provider].isEnabled = false;
              state.isSaving = false;
            });
          } else {
            throw new Error('Failed to delete API key');
          }
        } catch (error) {
          console.error('Error deleting API key:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Validate API key for a provider
      validateApiKey: async (provider) => {
        set((state) => {
          state.isValidating = true;
        });

        try {
          const response = await fetch('/api/user/api-keys/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider }),
          });

          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.providers[provider].apiKeyValid = data.valid;
              state.isValidating = false;
            });
            return data.valid;
          } else {
            throw new Error('Failed to validate API key');
          }
        } catch (error) {
          console.error('Error validating API key:', error);
          set((state) => {
            state.providers[provider].apiKeyValid = false;
            state.isValidating = false;
          });
          return false;
        }
      },

      // Update provider settings
      updateProviderSettings: async (provider, settings) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch('/api/providers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, ...settings }),
          });

          if (response.ok) {
            set((state) => {
              Object.assign(state.providers[provider], settings);
              state.isSaving = false;
            });
          } else {
            throw new Error('Failed to update provider settings');
          }
        } catch (error) {
          console.error('Error updating provider settings:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Create custom model
      createCustomModel: async (model) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch('/api/user/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(model),
          });

          if (response.ok) {
            const data = await response.json();
            set((state) => {
              const customModel: ModelConfig = {
                id: data.model.modelId,
                displayName: data.model.displayName,
                description: data.model.description || '',
                maxTokens: Number(data.model.maxTokens),
                supportsVision: data.model.supportsVision,
                supportsTools: data.model.supportsTools,
                supportsAudio: data.model.supportsAudio,
                supportsVideo: data.model.supportsVideo,
                supportsDocument: data.model.supportsDocument,
                costPer1kInputTokens: Number(data.model.costPer1kInputTokens),
                costPer1kOutputTokens: Number(data.model.costPer1kOutputTokens),
                isCustom: true,
              };
              state.providers[model.provider].customModels.push(customModel);
              state.isSaving = false;
            });
          } else {
            throw new Error('Failed to create custom model');
          }
        } catch (error) {
          console.error('Error creating custom model:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Update custom model
      updateCustomModel: async (modelId, updates) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch('/api/user/models', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: modelId, ...updates }),
          });

          if (response.ok) {
            set((state) => {
              // Find and update the custom model across all providers
              for (const provider of Object.values(state.providers)) {
                const modelIndex = provider.customModels.findIndex(m => m.id === modelId);
                if (modelIndex !== -1) {
                  Object.assign(provider.customModels[modelIndex], updates);
                  break;
                }
              }
              state.isSaving = false;
            });
          } else {
            throw new Error('Failed to update custom model');
          }
        } catch (error) {
          console.error('Error updating custom model:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Delete custom model
      deleteCustomModel: async (modelId) => {
        set((state) => {
          state.isSaving = true;
        });

        try {
          const response = await fetch(`/api/user/models?id=${modelId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            set((state) => {
              // Remove the custom model from all providers
              for (const provider of Object.values(state.providers)) {
                const modelIndex = provider.customModels.findIndex(m => m.id === modelId);
                if (modelIndex !== -1) {
                  provider.customModels.splice(modelIndex, 1);
                  break;
                }
              }
              state.isSaving = false;
            });
          } else {
            throw new Error('Failed to delete custom model');
          }
        } catch (error) {
          console.error('Error deleting custom model:', error);
          set((state) => {
            state.isSaving = false;
          });
          throw error;
        }
      },

      // Set selected provider
      setSelectedProvider: (provider) => {
        set((state) => {
          state.selectedProvider = provider;
          // Reset selected model when changing provider
          state.selectedModel = null;
        });
      },

      // Set selected model
      setSelectedModel: (model) => {
        set((state) => {
          state.selectedModel = model;
        });
      },

      // Get available (enabled) providers
      getAvailableProviders: () => {
        const state = get();
        return Object.keys(state.providers).filter(
          (provider) => state.providers[provider as ProviderType].isEnabled
        ) as ProviderType[];
      },

      // Get available models for a provider
      getAvailableModels: (provider) => {
        const state = get();
        const providerConfig = state.providers[provider];
        if (!providerConfig) return [];

        return [
          ...providerConfig.availableModels,
          ...providerConfig.customModels,
        ];
      },
    })),
    {
      name: 'kepler-providers',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential state, not loading states
      partialize: (state) => ({
        providers: state.providers,
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
      }),
    }
  )
);