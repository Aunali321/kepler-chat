import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { getUserApiKeys, getUserApiKey, getUserCustomModels, getUserProviderPreferences } from '@/lib/db/queries';
import { decryptApiKey } from '@/lib/crypto';
import type { ProviderType, ModelConfig, ProviderConfig } from '@/lib/db/types';

// Default models for each provider (fallback when no custom models configured)
const DEFAULT_MODELS: Record<ProviderType, ModelConfig[]> = {
  openai: [
    {
      id: 'gpt-4.1-mini',
      displayName: 'GPT 4.1 Mini',
      description: 'Most cost-efficient GPT-4 model',
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.4 / 1000,
      costPer1kOutputTokens: 1.6 / 1000,
      isCustom: false,
    },
    {
      id: 'o4-mini',
      displayName: 'o4 Mini',
      description: 'Intelligent reasoning and coding model',
      maxTokens: 128000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.0011,
      costPer1kOutputTokens: 0.0044,
      isCustom: false,
    },
  ],
  anthropic: [
    {
      id: 'claude-sonnet-4-20250514',
      displayName: 'Claude 4 Sonnet',
      description: 'Strong reasoning and coding capabilities',
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 3.0 / 1000,
      costPer1kOutputTokens: 15.0 / 1000,
      isCustom: false,
    },
    {
      id: 'claude-3-5-haiku-20241022',
      displayName: 'Claude 3.5 Haiku',
      description: 'Fast and efficient Claude model',
      maxTokens: 200000,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: true,
      costPer1kInputTokens: 0.80 / 1000,
      costPer1kOutputTokens: 4.0 / 1000,
      isCustom: false,
    },
  ],
  google: [
    {
      id: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      description: 'Fast and efficient Gemini model with large context',
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 0.075 / 1000,
      costPer1kOutputTokens: 0.30 / 1000,
      isCustom: false,
    },
    {
      id: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      description: 'High-performance model with large context window',
      maxTokens: 2097152,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 1.25 / 1000,
      costPer1kOutputTokens: 5.0 / 1000,
      isCustom: false,
    },
    {
      id: 'gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      description: 'Cost-efficient Gemini model with multi-modal capabilities',
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 0.15 / 1000,
      costPer1kOutputTokens: 0.60 / 1000,
      isCustom: false,
    },
    {
      id: 'gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      description: 'Most capable Gemini model',
      maxTokens: 1048576,
      supportsVision: true,
      supportsTools: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsDocument: true,
      costPer1kInputTokens: 1.25 / 1000,
      costPer1kOutputTokens: 10.0 / 1000,
      isCustom: false,
    },
  ],
  openrouter: [
    {
      id: 'qwen/qwen-2.5-coder-32b-instruct',
      displayName: 'Qwen 2.5 Coder 32B',
      description: 'Most capable open-source coding model',
      maxTokens: 32768,
      supportsVision: false,
      supportsTools: true,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.06 / 1000,
      costPer1kOutputTokens: 0.15 / 1000,
      isCustom: false,
    },
    {
      id: 'qwen/qwen2.5-vl-72b-instruct',
      displayName: 'Qwen 2.5 VL 72B',
      description: 'Most capable open-source vision model',
      maxTokens: 32000,
      supportsVision: true,
      supportsTools: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsDocument: false,
      costPer1kInputTokens: 0.25 / 1000,
      costPer1kOutputTokens: 0.75 / 1000,
      isCustom: false,
    },
  ],
};

/**
 * Enhanced provider manager that works with user configurations
 */
export class ProviderManager {
  private userApiKeys: Map<ProviderType, string> = new Map();
  private userPreferences: Map<ProviderType, any> = new Map();
  private userCustomModels: Map<ProviderType, ModelConfig[]> = new Map();
  private static instance: ProviderManager;

  static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * Initialize provider manager with user-specific configuration
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Load user API keys
      const apiKeys = await getUserApiKeys(userId);
      apiKeys.forEach(apiKey => {
        if (apiKey.validationStatus === 'valid') {
          try {
            const decryptedKey = decryptApiKey(apiKey.encryptedApiKey);
            this.userApiKeys.set(apiKey.provider as ProviderType, decryptedKey);
          } catch (error) {
            console.error(`Failed to decrypt API key for ${apiKey.provider}:`, error);
          }
        }
      });

      // Load user preferences
      const preferences = await getUserProviderPreferences(userId);
      preferences.forEach(pref => {
        this.userPreferences.set(pref.provider as ProviderType, pref);
      });

      // Load custom models
      const customModels = await getUserCustomModels(userId);
      const modelsByProvider = customModels.reduce((acc, model) => {
        if (!acc[model.provider]) {
          acc[model.provider] = [];
        }
        acc[model.provider].push({
          id: model.modelId,
          displayName: model.displayName,
          description: model.description || '',
          maxTokens: Number(model.maxTokens),
          supportsVision: model.supportsVision || false,
          supportsTools: model.supportsTools || false,
          supportsAudio: model.supportsAudio || false,
          supportsVideo: model.supportsVideo || false,
          supportsDocument: model.supportsDocument || false,
          costPer1kInputTokens: Number(model.costPer1kInputTokens),
          costPer1kOutputTokens: Number(model.costPer1kOutputTokens),
          isCustom: true,
        });
        return acc;
      }, {} as Record<string, ModelConfig[]>);

      Object.entries(modelsByProvider).forEach(([provider, models]) => {
        this.userCustomModels.set(provider as ProviderType, models);
      });

    } catch (error) {
      console.error('Failed to initialize provider manager:', error);
    }
  }

  /**
   * Get provider configuration for a user
   */
  async getProviderConfig(userId: string, provider: ProviderType): Promise<ProviderConfig | null> {
    const defaultModels = DEFAULT_MODELS[provider];
    if (!defaultModels) return null;

    try {
      // Get user API key
      const userApiKey = await getUserApiKey(userId, provider);

      // Get user preferences
      const userPreference = this.userPreferences.get(provider);

      // Get custom models
      const customModels = this.userCustomModels.get(provider) || [];

      return {
        provider,
        isEnabled: userPreference?.isEnabled || false,
        hasApiKey: !!userApiKey,
        apiKeyValid: userApiKey?.validationStatus === 'valid',
        defaultModel: userPreference?.defaultModel,
        availableModels: defaultModels,
        customModels,
      };
    } catch (error) {
      console.error(`Failed to get provider config for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Get model instance with user-configured API key
   */
  async getModelInstance(userId: string, providerId: ProviderType, modelId: string) {
    // Ensure we have the latest user data
    await this.initialize(userId);

    const apiKey = this.userApiKeys.get(providerId);
    if (!apiKey) {
      throw new Error(`No valid API key for provider ${providerId}`);
    }

    // Get model configuration
    const defaultModels = DEFAULT_MODELS[providerId] || [];
    const defaultModel = defaultModels.find(m => m.id === modelId);

    // Check if it's a custom model
    const customModels = this.userCustomModels.get(providerId) || [];
    const customModel = customModels.find(m => m.id === modelId);

    const modelConfig = defaultModel || customModel;
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found for provider ${providerId}`);
    }

    // Create provider instance with user's API key
    switch (providerId) {
      case 'openai': {
        const { createOpenAI } = await import('@ai-sdk/openai');
        const openaiProvider = createOpenAI({
          apiKey,
        });
        return openaiProvider(modelId);
      }
      case 'anthropic': {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        const anthropicProvider = createAnthropic({
          apiKey,
        });
        return anthropicProvider(modelId);
      }
      case 'google': {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const googleProvider = createGoogleGenerativeAI({
          apiKey,
        });
        return googleProvider(modelId);
      }
      case 'openrouter': {
        const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
        const openRouterProvider = createOpenRouter({
          apiKey,
        });
        return openRouterProvider(modelId);
      }
      default:
        throw new Error(`Provider ${providerId} not implemented`);
    }
  }

  /**
   * Get available providers for a user (those with valid API keys)
   */
  async getAvailableProviders(userId: string): Promise<ProviderType[]> {
    await this.initialize(userId);

    const availableProviders: ProviderType[] = [];

    for (const provider of Object.keys(DEFAULT_MODELS) as ProviderType[]) {
      const hasApiKey = this.userApiKeys.has(provider);
      const userPreference = this.userPreferences.get(provider);

      if (hasApiKey && userPreference?.isEnabled) {
        availableProviders.push(provider);
      }
    }

    return availableProviders;
  }

  /**
   * Get available models for a provider and user
   */
  async getAvailableModels(userId: string, provider: ProviderType): Promise<ModelConfig[]> {
    const config = await this.getProviderConfig(userId, provider);
    if (!config || !config.isEnabled || !config.hasApiKey || !config.apiKeyValid) {
      return [];
    }

    return [...config.availableModels, ...config.customModels];
  }

  /**
   * Get default model for a user based on their preferences and available providers
   */
  async getDefaultModel(userId: string): Promise<{ providerId: ProviderType; modelId: string } | null> {
    const availableProviders = await this.getAvailableProviders(userId);

    if (availableProviders.length === 0) {
      return null;
    }

    // Check user's default provider preference
    for (const provider of availableProviders) {
      const preference = this.userPreferences.get(provider);
      if (preference?.defaultModel) {
        const models = await this.getAvailableModels(userId, provider);
        const model = models.find(m => m.id === preference.defaultModel);
        if (model) {
          return { providerId: provider, modelId: model.id };
        }
      }
    }

    // Fallback to first available provider and its first model
    const firstProvider = availableProviders[0];
    const models = await this.getAvailableModels(userId, firstProvider);
    if (models.length > 0) {
      return { providerId: firstProvider, modelId: models[0].id };
    }

    return null;
  }

  /**
   * Clear cached data for a user (call when user settings change)
   */
  clearUserCache(): void {
    this.userApiKeys.clear();
    this.userPreferences.clear();
    this.userCustomModels.clear();
  }

  /**
   * Check if a provider is available for a user
   */
  async isProviderAvailable(userId: string, provider: ProviderType): Promise<boolean> {
    await this.initialize(userId);

    const hasApiKey = this.userApiKeys.has(provider);
    const userPreference = this.userPreferences.get(provider);

    return hasApiKey && userPreference?.isEnabled === true;
  }
}

// Singleton instance
export const providerManager = ProviderManager.getInstance();

// Legacy functions for backward compatibility
export async function getModelInstance(userId: string, providerId: ProviderType, modelId: string) {
  await providerManager.initialize(userId);
  return providerManager.getModelInstance(userId, providerId, modelId);
}

export async function getDefaultModel(userId: string) {
  await providerManager.initialize(userId);
  return providerManager.getDefaultModel(userId);
}

export async function getAvailableProviders(userId: string) {
  await providerManager.initialize(userId);
  return providerManager.getAvailableProviders(userId);
}

export async function getAvailableModels(userId: string, provider: ProviderType) {
  await providerManager.initialize(userId);
  return providerManager.getAvailableModels(userId, provider);
}