import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProviderConfig, ProviderType, ModelConfig } from '@/lib/db/types';

export interface ProviderState {
  // Provider configurations
  providers: Record<ProviderType, ProviderConfig>;

  // Loading states
  isLoading: boolean;
  isValidating: boolean;

  // Actions
  loadProviders: () => Promise<void>;
  saveApiKey: (provider: ProviderType, apiKey: string) => Promise<void>;
  deleteApiKey: (provider: ProviderType) => Promise<void>;
  validateApiKey: (provider: ProviderType) => Promise<boolean>;
  toggleProvider: (provider: ProviderType, enabled: boolean) => void;
  updateProviderSettings: (provider: ProviderType, settings: Partial<ProviderConfig>) => void;
  
  // Getters
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
  immer((set, get) => ({
    // Initial state
    providers: defaultProviders,
    isLoading: false,
    isValidating: false,

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
    saveApiKey: async (provider, apiKey) => {
      try {
        const response = await fetch('/api/user/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey }),
        });

        if (response.ok) {
          // Reload providers to get updated state
          await get().loadProviders();
        } else {
          throw new Error('Failed to save API key');
        }
      } catch (error) {
        console.error('Error saving API key:', error);
        throw error;
      }
    },

    // Delete API key for a provider
    deleteApiKey: async (provider) => {
      try {
        const response = await fetch(`/api/user/api-keys?provider=${provider}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Reload providers to get updated state
          await get().loadProviders();
        } else {
          throw new Error('Failed to delete API key');
        }
      } catch (error) {
        console.error('Error deleting API key:', error);
        throw error;
      }
    },

    // Validate API key for a provider
    validateApiKey: async (provider) => {
      try {
        set((state) => {
          state.isValidating = true;
        });

        const response = await fetch('/api/user/api-keys/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        });

        if (response.ok) {
          const data = await response.json();
          // Reload providers to get updated validation status
          await get().loadProviders();
          return data.isValid;
        } else {
          throw new Error('Failed to validate API key');
        }
      } catch (error) {
        console.error('Error validating API key:', error);
        return false;
      } finally {
        set((state) => {
          state.isValidating = false;
        });
      }
    },

    // Toggle provider enabled state
    toggleProvider: (provider, enabled) => {
      set((state) => {
        state.providers[provider].isEnabled = enabled;
      });
    },

    // Update provider settings
    updateProviderSettings: (provider, settings) => {
      set((state) => {
        Object.assign(state.providers[provider], settings);
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
  }))
);