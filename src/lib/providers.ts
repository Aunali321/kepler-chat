import type { ProviderType, ModelConfig } from '@/lib/db/types';
import { createModelInstance } from './model-factory';
import { getApiKey } from './api-keys';
import { getProviderConfig, getUserProviders } from './provider-config';
import type { LanguageModel } from 'ai';

/**
 * Get model instance for chat - core function for chat API
 */
export async function getModelForChat(
  userId: string, 
  provider: ProviderType, 
  model: string
): Promise<LanguageModel> {
  const apiKey = await getApiKey(userId, provider);
  return createModelInstance(provider, model, apiKey);
}

/**
 * Get available providers for user (those with valid API keys)
 */
export async function getAvailableProviders(userId: string): Promise<ProviderType[]> {
  const providers = await getUserProviders(userId);
  return providers
    .filter(p => p.isEnabled && p.hasApiKey && p.apiKeyValid)
    .map(p => p.provider);
}

/**
 * Get available models for provider
 */
export async function getAvailableModels(
  userId: string, 
  provider: ProviderType
): Promise<ModelConfig[]> {
  const config = await getProviderConfig(userId, provider);
  if (!config || !config.isEnabled || !config.hasApiKey || !config.apiKeyValid) {
    return [];
  }
  return [...config.availableModels, ...config.customModels];
}

/**
 * Get default model for user based on preferences
 */
export async function getDefaultModel(userId: string): Promise<{ providerId: ProviderType; modelId: string } | null> {
  const availableProviders = await getAvailableProviders(userId);
  if (availableProviders.length === 0) return null;

  const providers = await getUserProviders(userId);
  
  // Check user's default provider preference
  for (const provider of availableProviders) {
    const providerConfig = providers.find(p => p.provider === provider);
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
}

/**
 * Check if provider is available for user
 */
export async function isProviderAvailable(userId: string, provider: ProviderType): Promise<boolean> {
  try {
    await getApiKey(userId, provider);
    return true;
  } catch {
    return false;
  }
}