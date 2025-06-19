import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { getUserProviders, getUserProvider, setProviderValidationStatus } from '@/lib/db/queries';
import { decryptApiKey } from '@/lib/crypto';
import type { ProviderType, ModelConfig, ProviderConfig } from '@/lib/db/types';
import { ApiKeyValidator } from './api-key-validator';
import { unstable_cache } from 'next/cache';

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
      id: 'anthropic/claude-sonnet-4',
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
      id: 'google/gemini-2.5-pro',
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
  deepseek: [],
  togetherai: [],
  groq: [],
  mistral: [],
};

// Cached functions for better performance
const getCachedUserProviders = unstable_cache(getUserProviders, ['user-providers'], {
  revalidate: 300, // 5 minutes
  tags: ['user-providers']
});

const getCachedUserProvider = unstable_cache(getUserProvider, ['user-provider'], {
  revalidate: 300,
  tags: ['user-provider']
});

/**
 * Load and validate API key for a specific provider
 */
async function loadApiKey(userId: string, provider: ProviderType): Promise<string | null> {
  try {
    const providerConfig = await getCachedUserProvider(userId, provider);
    if (!providerConfig || providerConfig.validationStatus !== 'valid' || !providerConfig.encryptedApiKey) {
      return null;
    }
    return decryptApiKey(providerConfig.encryptedApiKey);
  } catch (error) {
    console.error(`Failed to load API key for ${provider}:`, error);
    return null;
  }
}

/**
 * Get provider configuration for a user
 */
export async function getProviderConfig(userId: string, provider: ProviderType): Promise<ProviderConfig | null> {
  const defaultModels = DEFAULT_MODELS[provider];
  if (!defaultModels) return null;

  try {
    const providerConfig = await getCachedUserProvider(userId, provider);

    const userCustomModels = (providerConfig?.customModels as any[] || []).map(model => ({
      id: model.modelId || model.id,
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
    }));

    return {
      provider,
      isEnabled: providerConfig?.isEnabled || false,
      hasApiKey: !!providerConfig?.encryptedApiKey,
      apiKeyValid: providerConfig?.validationStatus === 'valid',
      defaultModel: providerConfig?.defaultModel,
      availableModels: defaultModels,
      customModels: userCustomModels,
    };
  } catch (error) {
    console.error(`Failed to get provider config for ${provider}:`, error);
    return null;
  }
}

/**
 * Get a model instance for a specific provider and model
 */
export async function getModelInstance(userId: string, providerId: ProviderType, modelId: string) {
  const apiKey = await loadApiKey(userId, providerId);

  if (!apiKey) {
    throw new Error(`No valid API key for provider ${providerId}`);
  }

  switch (providerId) {
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openaiProvider = createOpenAI({ apiKey });
      return openaiProvider(modelId);
    }
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropicProvider = createAnthropic({ apiKey });
      return anthropicProvider(modelId);
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const googleProvider = createGoogleGenerativeAI({ apiKey });
      return googleProvider(modelId);
    }
    case 'openrouter': {
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
      const openRouterProvider = createOpenRouter({ apiKey });
      return openRouterProvider(modelId);
    }
    default:
      throw new Error(`Provider ${providerId} not implemented`);
  }
}

/**
 * Get available providers for a user (those with valid API keys)
 */
export async function getAvailableProviders(userId: string): Promise<ProviderType[]> {
  try {
    const userProviders = await getCachedUserProviders(userId);

    const availableProviders: ProviderType[] = [];

    for (const provider of Object.keys(DEFAULT_MODELS) as ProviderType[]) {
      const providerConfig = userProviders.find(p => p.provider === provider);
      
      if (providerConfig?.isEnabled && 
          providerConfig?.encryptedApiKey && 
          providerConfig?.validationStatus === 'valid') {
        availableProviders.push(provider);
      }
    }

    return availableProviders;
  } catch (error) {
    console.error('Failed to get available providers:', error);
    return [];
  }
}

/**
 * Get available models for a provider and user
 */
export async function getAvailableModels(userId: string, provider: ProviderType): Promise<ModelConfig[]> {
  const config = await getProviderConfig(userId, provider);
  if (!config || !config.isEnabled || !config.hasApiKey || !config.apiKeyValid) {
    return [];
  }

  return [...config.availableModels, ...config.customModels];
}

/**
 * Get default model for a user based on their preferences and available providers
 */
export async function getDefaultModel(userId: string): Promise<{ providerId: ProviderType; modelId: string } | null> {
  try {
    const availableProviders = await getAvailableProviders(userId);

    if (availableProviders.length === 0) {
      return null;
    }

    const userProviders = await getCachedUserProviders(userId);

    // Check user's default provider preference
    for (const provider of availableProviders) {
      const providerConfig = userProviders.find(p => p.provider === provider);
      if (providerConfig?.defaultModel) {
        const models = await getAvailableModels(userId, provider);
        const model = models.find(m => m.id === providerConfig.defaultModel);
        if (model) {
          return { providerId: provider, modelId: model.id };
        }
      }
    }

    // Fallback to first available provider and its first model
    const firstProvider = availableProviders[0];
    const models = await getAvailableModels(userId, firstProvider);
    if (models.length > 0) {
      return { providerId: firstProvider, modelId: models[0].id };
    }

    return null;
  } catch (error) {
    console.error('Failed to get default model:', error);
    return null;
  }
}

/**
 * Check if a provider is available for a user
 */
export async function isProviderAvailable(userId: string, provider: ProviderType): Promise<boolean> {
  const apiKey = await loadApiKey(userId, provider);
  return !!apiKey;
}

/**
 * Validate an API key for a provider
 */
export async function validateAndStoreApiKey(userId: string, provider: ProviderType, apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const result = await ApiKeyValidator.validateApiKey(provider, apiKey);

    await setProviderValidationStatus(
      userId,
      provider,
      result.isValid ? 'valid' : 'invalid'
    );

    return result;
  } catch (error) {
    console.error(`Error validating API key for ${provider}:`, error);
    return { isValid: false, error: 'Validation failed' };
  }
}