import { NextRequest, NextResponse } from 'next/server';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import {
  getUserProviders,
  getUserProvider,
  createUserProvider,
  updateUserProvider
} from '@/lib/db/queries';
import { getProviderConfig } from '@/lib/provider-manager';
import type { ProviderType, ProviderConfig } from '@/lib/db/types';

// GET /api/providers - Get all provider configurations for the current user
async function getHandler(req: Request, user: { id: string; email: string; name?: string }) {
  // Provider manager is now stateless - no initialization needed

  // Get all supported provider types
  const supportedProviders: ProviderType[] = ['openai', 'anthropic', 'google', 'openrouter'];
  
  // Build provider configurations using provider manager
  const providerConfigs: Record<ProviderType, ProviderConfig> = {} as any;

  for (const providerId of supportedProviders) {
    const config = await getProviderConfig(user.id, providerId);
    if (config) {
      providerConfigs[providerId] = config;
    }
  }

  return NextResponse.json({ providers: providerConfigs });
}

// PUT /api/providers - Update provider preferences
async function putHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  const { provider, isEnabled, defaultModel, settings } = await request.json();

  if (!provider) {
    throw new Error('Provider is required');
  }

  // Validate provider type
  const validProviders: ProviderType[] = [
    'openai', 'anthropic', 'google', 'openrouter'
  ];

  if (!validProviders.includes(provider)) {
    throw new Error('Invalid provider');
  }

  // Get existing preference
  const providers = await getUserProviders(user.id);
  const existingProvider = providers.find(p => p.provider === provider);

  let updatedProvider;
  if (existingProvider) {
    // Update existing preference
    updatedProvider = await updateUserProvider(user.id, provider, {
      isEnabled,
      defaultModel,
      settings: settings || {},
    });
  } else {
    // Create new preference
    updatedProvider = await createUserProvider({
      userId: user.id,
      provider,
      isEnabled: isEnabled ?? false,
      defaultModel,
      settings: settings || {},
    });
  }

  return NextResponse.json({ provider: updatedProvider });
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const PUT = withErrorHandling(withAuthUser(putHandler));