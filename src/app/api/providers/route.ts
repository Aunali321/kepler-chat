import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import {
  createUserProviderPreference,
  updateUserProviderPreference,
  getUserProviderPreferences
} from '@/lib/db/queries';
import { getProviderConfig } from '@/lib/provider-manager';
import type { ProviderType, ProviderConfig } from '@/lib/db/types';

// GET /api/providers - Get all provider configurations for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch (error) {
    console.error('Error fetching provider configurations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/providers - Update provider preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, isEnabled, defaultModel, settings } = await request.json();

    if (!provider) {
      return NextResponse.json({
        error: 'Provider is required'
      }, { status: 400 });
    }

    // Validate provider type
    const validProviders: ProviderType[] = [
      'openai', 'anthropic', 'google', 'openrouter'
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json({
        error: 'Invalid provider'
      }, { status: 400 });
    }

    // Get existing preference
    const preferences = await getUserProviderPreferences(user.id);
    const existingPreference = preferences.find(p => p.provider === provider);

    let updatedPreference;
    if (existingPreference) {
      // Update existing preference
      updatedPreference = await updateUserProviderPreference(user.id, provider, {
        isEnabled,
        defaultModel,
        settings: settings || {},
      });
    } else {
      // Create new preference
      updatedPreference = await createUserProviderPreference({
        userId: user.id,
        provider,
        isEnabled: isEnabled ?? false,
        defaultModel,
        settings: settings || {},
      });
    }

    return NextResponse.json({ preference: updatedPreference });
  } catch (error) {
    console.error('Error updating provider preference:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}