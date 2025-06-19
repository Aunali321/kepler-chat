import { getUserProvider, updateUserProvider, getOrCreateUserProvider } from '@/lib/db/queries';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { ApiKeyValidator } from './api-key-validator';
import type { ProviderType } from '@/lib/db/types';

/**
 * Get decrypted API key for provider
 */
export async function getApiKey(userId: string, provider: ProviderType): Promise<string> {
  const providerConfig = await getUserProvider(userId, provider);
  
  // DEBUG: Log detailed information about API key retrieval attempts
  console.log(`=== getApiKey DEBUG ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Provider: ${provider}`);
  console.log(`Provider config found: ${!!providerConfig}`);
  
  if (providerConfig) {
    console.log(`Validation status: ${providerConfig.validationStatus}`);
    console.log(`Is enabled: ${providerConfig.isEnabled}`);
    console.log(`Has encrypted key: ${!!providerConfig.encryptedApiKey}`);
    console.log(`Last validated: ${providerConfig.lastValidated}`);
    console.log(`Created at: ${providerConfig.createdAt}`);
    console.log(`Updated at: ${providerConfig.updatedAt}`);
  }
  
  if (!providerConfig || 
      providerConfig.validationStatus !== 'valid' || 
      !providerConfig.encryptedApiKey) {
    
    const reason = !providerConfig 
      ? 'Provider config not found'
      : providerConfig.validationStatus !== 'valid'
      ? `Invalid validation status: ${providerConfig.validationStatus}`
      : 'No encrypted API key found';
    
    console.log(`API key retrieval failed: ${reason}`);
    console.log(`=== END getApiKey DEBUG ===`);
    
    throw new Error(`No valid API key for provider ${provider}: ${reason}`);
  }

  console.log(`API key retrieval successful`);
  console.log(`=== END getApiKey DEBUG ===`);
  
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