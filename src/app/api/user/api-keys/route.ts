import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import { 
  apiKeySchema, 
  apiKeyQuerySchema, 
  apiKeyDeleteSchema 
} from '@/lib/schemas/api';
import {
  getUserProviders,
  getUserProvider,
  createUserProvider,
  updateUserProvider,
  deleteUserProvider,
} from '@/lib/db/queries';
import { encryptApiKey, maskApiKey } from '@/lib/crypto';
import { validateApiKey } from '@/lib/api-keys';
import type { ProviderType, User } from '@/lib/db/types';

// GET /api/user/api-keys - Get all API keys for the current user
async function getHandler(
  request: NextRequest, 
  user: User, 
  { query }: { query: { provider?: ProviderType } }
) {
  const { provider } = query;
  
  const providers = provider 
    ? [await getUserProvider(user.id, provider)].filter(Boolean)
    : await getUserProviders(user.id);

  // DEBUG: Log validation status details to console
  console.log('=== API KEYS VALIDATION STATUS DEBUG ===');
  console.log(`User ID: ${user.id}`);
  console.log(`Total providers found: ${providers.length}`);
  
  providers.forEach((p, index) => {
    console.log(`\nProvider ${index + 1}:`);
    console.log(`  - ID: ${p.id}`);
    console.log(`  - Provider: ${p.provider}`);
    console.log(`  - Validation Status: ${p.validationStatus}`);
    console.log(`  - Is Enabled: ${p.isEnabled}`);
    console.log(`  - Has API Key: ${!!p.encryptedApiKey}`);
    console.log(`  - Last Validated: ${p.lastValidated}`);
    console.log(`  - Created At: ${p.createdAt}`);
    console.log(`  - Updated At: ${p.updatedAt}`);
  });
  
  // Count by validation status
  const statusCounts = providers.reduce((acc, p) => {
    acc[p.validationStatus] = (acc[p.validationStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\nValidation Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
  console.log('=== END DEBUG ===\n');

  // Return masked API keys for security with validation status included
  const apiKeys = providers.map(provider => ({
    id: provider.id,
    provider: provider.provider,
    isActive: provider.isEnabled,
    lastValidated: provider.lastValidated,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
    maskedApiKey: provider.encryptedApiKey ? maskApiKey('****') : null,
    hasApiKey: !!provider.encryptedApiKey,
    validationStatus: provider.validationStatus, // Include validation status in response
    // DEBUG: Additional debug fields (remove these in production)
    _debug: {
      validationStatus: provider.validationStatus,
      lastValidated: provider.lastValidated,
      timeSinceLastValidation: provider.lastValidated 
        ? `${Math.round((Date.now() - new Date(provider.lastValidated).getTime()) / (1000 * 60))} minutes ago`
        : 'Never validated',
      hasEncryptedKey: !!provider.encryptedApiKey,
    }
  }));

  return responses.ok({ 
    apiKeys,
    // DEBUG: Include summary in response
    _debug: {
      totalProviders: providers.length,
      validationStatusCounts: statusCounts,
      timestamp: new Date().toISOString(),
    }
  });
}

// POST /api/user/api-keys - Save or update an API key
async function postHandler(
  request: NextRequest, 
  user: User, 
  { body }: { body: typeof apiKeySchema._type }
) {
  const { provider, apiKey, metadata } = body;

  // Validate the API key first
  const validation = await validateApiKey(provider, apiKey);
  if (!validation.isValid) {
    return responses.invalidApiKey();
  }

  // Encrypt the API key
  const encryptedApiKey = encryptApiKey(apiKey);

  // Check if provider config already exists
  const existingProvider = await getUserProvider(user.id, provider);

  let savedProvider;
  if (existingProvider) {
    // Update existing provider
    savedProvider = await updateUserProvider(user.id, provider, {
      encryptedApiKey,
      settings: metadata || {},
      isEnabled: true,
      validationStatus: 'valid',
      lastValidated: new Date(),
    });
  } else {
    // Create new provider
    savedProvider = await createUserProvider({
      userId: user.id,
      provider,
      encryptedApiKey,
      settings: metadata || {},
      isEnabled: true,
      validationStatus: 'valid',
      lastValidated: new Date(),
    });
  }

  // Invalidate cache to ensure onboarding state updates immediately
  revalidateTag('user-providers');
  revalidateTag('user-provider');

  // Return the saved provider without the encrypted value
  const apiKeyData = {
    id: savedProvider.id,
    provider: savedProvider.provider,
    isActive: savedProvider.isEnabled,
    lastValidated: savedProvider.lastValidated,
    createdAt: savedProvider.createdAt,
    updatedAt: savedProvider.updatedAt,
    hasApiKey: true,
    maskedApiKey: maskApiKey(apiKey),
  };

  return responses.created({ apiKey: apiKeyData });
}

// DELETE /api/user/api-keys - Delete an API key
async function deleteHandler(
  request: NextRequest, 
  user: User, 
  { query }: { query: { provider: ProviderType } }
) {
  const { provider } = query;

  const deletedProvider = await deleteUserProvider(user.id, provider);
  if (!deletedProvider) {
    return responses.notFound('API key not found');
  }

  // Invalidate cache to ensure onboarding state updates immediately
  revalidateTag('user-providers');
  revalidateTag('user-provider');

  return responses.deleted(`${provider} API key deleted successfully`);
}

export const GET = withErrorHandling(
  authMiddleware.withQuery(apiKeyQuerySchema)(getHandler)
);

export const POST = withErrorHandling(
  authMiddleware.withBody(apiKeySchema)(postHandler)
);

export const DELETE = withErrorHandling(
  authMiddleware.withQuery(apiKeyDeleteSchema)(deleteHandler)
);