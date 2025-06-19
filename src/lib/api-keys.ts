import { getUserProvider, updateUserProvider, getOrCreateUserProvider } from '@/lib/db/queries';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { ApiKeyValidator } from './api-key-validator';
import type { ProviderType } from '@/lib/db/types';

/**
 * Get decrypted API key for provider
 */
export async function getApiKey(userId: string, provider: ProviderType): Promise<string> {
  const providerConfig = await getUserProvider(userId, provider);
  
  if (!providerConfig || 
      providerConfig.validationStatus !== 'valid' || 
      !providerConfig.encryptedApiKey) {
    throw new Error(`No valid API key for provider ${provider}`);
  }

  return decryptApiKey(providerConfig.encryptedApiKey);
}

/**
 * Save and validate API key for provider
 */
export async function saveApiKey(
  userId: string,
  provider: ProviderType,
  apiKey: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Validate the API key first
    const validation = await ApiKeyValidator.validateApiKey(provider, apiKey);
    
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }

    // Encrypt and save the API key
    const encryptedApiKey = encryptApiKey(apiKey);
    
    await updateUserProvider(userId, provider, {
      encryptedApiKey,
      validationStatus: 'valid',
      lastValidated: new Date(),
      isEnabled: true,
    });

    return { isValid: true };
  } catch (error) {
    console.error(`Error saving API key for ${provider}:`, error);
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Failed to save API key' 
    };
  }
}

/**
 * Delete API key for provider
 */
export async function deleteApiKey(userId: string, provider: ProviderType): Promise<void> {
  await updateUserProvider(userId, provider, {
    encryptedApiKey: null,
    validationStatus: 'invalid',
    isEnabled: false,
  });
}

/**
 * Validate API key without saving
 */
export async function validateApiKey(
  provider: ProviderType, 
  apiKey: string
): Promise<{ isValid: boolean; error?: string }> {
  const result = await ApiKeyValidator.validateApiKey(provider, apiKey);
  return {
    isValid: result.isValid,
    error: result.error,
  };
}