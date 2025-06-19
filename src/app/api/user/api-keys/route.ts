import { NextRequest, NextResponse } from 'next/server';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import {
  getUserProviders,
  getUserProvider,
  createUserProvider,
  updateUserProvider,
  deleteUserProvider,
  setProviderValidationStatus
} from '@/lib/db/queries';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/crypto';
import type { ProviderType } from '@/lib/db/types';

// GET /api/user/api-keys - Get all API keys for the current user
async function getHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  try {
    const providers = await getUserProviders(user.id);

    // Return masked API keys for security
    const maskedApiKeys = providers.map(provider => ({
      id: provider.id,
      provider: provider.provider,
      isActive: provider.isEnabled,
      lastValidated: provider.lastValidated,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      encryptedApiKey: undefined, // Never return the encrypted key
      maskedApiKey: provider.encryptedApiKey ? maskApiKey('****') : null, // Just show it exists
      hasApiKey: !!provider.encryptedApiKey,
    }));

    return NextResponse.json({ apiKeys: maskedApiKeys });
  } catch (error) {
    throw error;
  }
}

// POST /api/user/api-keys - Save or update an API key
async function postHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  try {
    const { provider, apiKey, metadata } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({
        error: 'Provider and API key are required'
      }, { status: 400 });
    }

    // Validate provider type
    const validProviders: ProviderType[] = [
      'openai', 'anthropic', 'google', 'openrouter', 'deepseek', 'togetherai', 'groq', 'mistral'
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json({
        error: 'Invalid provider'
      }, { status: 400 });
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
      });
    } else {
      // Create new provider
      savedProvider = await createUserProvider({
        userId: user.id,
        provider,
        encryptedApiKey,
        settings: metadata || {},
        isEnabled: true,
      });
    }

    // Return the saved provider without the encrypted value
    return NextResponse.json({
      apiKey: {
        id: savedProvider.id,
        provider: savedProvider.provider,
        isActive: savedProvider.isEnabled,
        lastValidated: savedProvider.lastValidated,
        createdAt: savedProvider.createdAt,
        updatedAt: savedProvider.updatedAt,
        encryptedApiKey: undefined,
        hasApiKey: true,
        maskedApiKey: maskApiKey(apiKey),
      }
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /api/user/api-keys - Delete an API key
async function deleteHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as ProviderType;

    if (!provider) {
      return NextResponse.json({
        error: 'Provider is required'
      }, { status: 400 });
    }

    const deletedProvider = await deleteUserProvider(user.id, provider);

    if (!deletedProvider) {
      return NextResponse.json({
        error: 'API key not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
      provider
    });
  } catch (error) {
    throw error;
  }
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const POST = withErrorHandling(withAuthUser(postHandler));
export const DELETE = withErrorHandling(withAuthUser(deleteHandler));