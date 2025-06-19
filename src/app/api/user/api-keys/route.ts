import { NextRequest, NextResponse } from 'next/server';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import {
  getUserApiKeys,
  getUserApiKey,
  createUserApiKey,
  updateUserApiKey,
  deleteUserApiKey,
  setApiKeyValidationStatus
} from '@/lib/db/queries';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/crypto';
import type { ProviderType } from '@/lib/db/types';

// GET /api/user/api-keys - Get all API keys for the current user
async function getHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {

    const apiKeys = await getUserApiKeys(user.id);

    // Return masked API keys for security
    const maskedApiKeys = apiKeys.map(key => ({
      ...key,
      encryptedApiKey: undefined, // Never return the encrypted key
      maskedApiKey: key.encryptedApiKey ? maskApiKey('****') : null, // Just show it exists
      hasApiKey: !!key.encryptedApiKey,
    }));

    return NextResponse.json({ apiKeys: maskedApiKeys });
}

// POST /api/user/api-keys - Save or update an API key
async function postHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {

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

    // Check if API key already exists for this provider
    const existingKey = await getUserApiKey(user.id, provider);

    let savedKey;
    if (existingKey) {
      // Update existing API key
      savedKey = await updateUserApiKey(user.id, provider, {
        encryptedApiKey,
        metadata: metadata || {},
        validationStatus: 'pending',
        isActive: true,
      });
    } else {
      // Create new API key
      savedKey = await createUserApiKey({
        userId: user.id,
        provider,
        encryptedApiKey,
        metadata: metadata || {},
        validationStatus: 'pending',
        isActive: true,
      });
    }

    // Return the saved key without the encrypted value
    return NextResponse.json({
      apiKey: {
        ...savedKey,
        encryptedApiKey: undefined,
        hasApiKey: true,
        maskedApiKey: maskApiKey(apiKey),
      }
    });
  } catch (error) {
    throw error;
}

// DELETE /api/user/api-keys - Delete an API key
async function deleteHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as ProviderType;

    if (!provider) {
      return NextResponse.json({
        error: 'Provider is required'
      }, { status: 400 });
    }

    const deletedKey = await deleteUserApiKey(user.id, provider);

    if (!deletedKey) {
      return NextResponse.json({
        error: 'API key not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
      provider
    });
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const POST = withErrorHandling(withAuthUser(postHandler));
export const DELETE = withErrorHandling(withAuthUser(deleteHandler));