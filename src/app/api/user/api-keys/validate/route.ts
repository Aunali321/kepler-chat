import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { getUserApiKey, getUserApiKeys, setApiKeyValidationStatus } from '@/lib/db/queries';
import { decryptApiKey } from '@/lib/crypto';
import { ApiKeyValidator } from '@/lib/api-key-validator';
import type { ProviderType } from '@/lib/db/types';

// POST /api/user/api-keys/validate - Validate all API keys for a user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKeys = await getUserApiKeys(user.id);
    const validationTasks = apiKeys.map(async (apiKey) => {
      try {
        const decryptedKey = decryptApiKey(apiKey.encryptedApiKey);
        const result = await ApiKeyValidator.validateApiKey(apiKey.provider as ProviderType, decryptedKey);
        
        // Update validation status in database
        await setApiKeyValidationStatus(
          user.id,
          apiKey.provider as ProviderType,
          result.isValid ? 'valid' : 'invalid'
        );

        return {
          provider: apiKey.provider,
          isValid: result.isValid,
          error: result.error,
          responseTime: result.responseTime,
          lastValidated: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Failed to validate ${apiKey.provider}:`, error);
        return {
          provider: apiKey.provider,
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
  } catch (error) {
    console.error('Error validating API keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user/api-keys/validate - Validate a specific API key
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ 
        error: 'Provider is required' 
      }, { status: 400 });
    }

    // Get the stored API key
    const storedKey = await getUserApiKey(user.id, provider);
    if (!storedKey) {
      return NextResponse.json({ 
        error: 'No API key found for this provider' 
      }, { status: 404 });
    }

    // Decrypt and validate the API key
    const apiKey = decryptApiKey(storedKey.encryptedApiKey);
    const result = await ApiKeyValidator.validateApiKey(provider, apiKey);

    // Update validation status in database
    await setApiKeyValidationStatus(
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
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}