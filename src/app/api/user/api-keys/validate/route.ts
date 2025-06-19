import { NextRequest, NextResponse } from 'next/server';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { getUserProvider, getUserProviders, setProviderValidationStatus } from '@/lib/db/queries';
import { decryptApiKey } from '@/lib/crypto';
import { ApiKeyValidator } from '@/lib/api-key-validator';
import type { ProviderType } from '@/lib/db/types';

// GET /api/user/api-keys/validate - Validate all API keys for a user
async function getHandler(req: Request, user: { id: string; email: string; name?: string }) {
  const providers = await getUserProviders(user.id);
  const validationTasks = providers.map(async (provider) => {
    try {
      if (!provider.encryptedApiKey) {
        return {
          provider: provider.provider as ProviderType,
          isValid: false,
          error: 'No API key configured',
          lastValidated: new Date().toISOString(),
        };
      }

      const decryptedKey = decryptApiKey(provider.encryptedApiKey);
      const result = await ApiKeyValidator.validateApiKey(provider.provider as ProviderType, decryptedKey);
      
      // Update validation status in database
      await setProviderValidationStatus(
        user.id,
        provider.provider as ProviderType,
        result.isValid ? 'valid' : 'invalid'
      );

      return {
        provider: provider.provider as ProviderType,
        isValid: result.isValid,
        error: result.error,
        responseTime: result.responseTime,
        lastValidated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to validate ${provider.provider}:`, error);
      return {
        provider: provider.provider as ProviderType,
        isValid: false,
        error: 'Validation failed',
        lastValidated: new Date().toISOString(),
      };
    }
  });

  const results = await Promise.all(validationTasks);
  const summary = ApiKeyValidator.getValidationSummary(results);

  return NextResponse.json({
    results,
    summary,
  });
}

// POST /api/user/api-keys/validate - Validate a specific API key
async function postHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  const { provider } = await request.json();

  if (!provider) {
    throw new Error('Provider is required');
  }

  // Get the stored API key
  const storedProvider = await getUserProvider(user.id, provider);
  if (!storedProvider || !storedProvider.encryptedApiKey) {
    throw new Error('No API key found for this provider');
  }

  // Decrypt and validate the API key
  const apiKey = decryptApiKey(storedProvider.encryptedApiKey);
  const result = await ApiKeyValidator.validateApiKey(provider, apiKey);

  // Update validation status in database
  await setProviderValidationStatus(
    user.id, 
    provider, 
    result.isValid ? 'valid' : 'invalid'
  );

  return NextResponse.json({
    provider,
    isValid: result.isValid,
    error: result.error,
    responseTime: result.responseTime,
    details: result.details,
    lastValidated: new Date().toISOString(),
  });
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const POST = withErrorHandling(withAuthUser(postHandler));