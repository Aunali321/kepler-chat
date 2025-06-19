import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import {
  getUserProviders,
  getUserProvider,
  updateUserProvider
} from '@/lib/db/queries';
import type { ProviderType } from '@/lib/db/types';

// GET /api/user/models - Get all custom models for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as ProviderType | undefined;

    // Get all providers or specific provider
    const providers = provider 
      ? [await getUserProvider(user.id, provider)].filter(Boolean)
      : await getUserProviders(user.id);

    // Extract custom models from all providers
    const models = providers.flatMap(p => 
      (p?.customModels as any[] || []).map(model => ({
        ...model,
        provider: p.provider
      }))
    );

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching custom models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user/models - Create a new custom model (now handled via provider updates)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      provider,
      modelId,
      displayName,
      description,
      maxTokens,
      supportsVision,
      supportsTools,
      supportsAudio,
      supportsVideo,
      supportsDocument,
      costPer1kInputTokens,
      costPer1kOutputTokens,
      metadata
    } = await request.json();

    // Validate required fields
    if (!provider || !modelId || !displayName) {
      return NextResponse.json({
        error: 'Provider, model ID, and display name are required'
      }, { status: 400 });
    }

    // Get or create provider
    let providerConfig = await getUserProvider(user.id, provider);
    if (!providerConfig) {
      return NextResponse.json({
        error: 'Provider not configured. Please add API key first.'
      }, { status: 400 });
    }

    // Build the new model object
    const newModel = {
      id: crypto.randomUUID(),
      modelId,
      displayName,
      description: description || null,
      maxTokens: maxTokens || 4096,
      supportsVision: supportsVision || false,
      supportsTools: supportsTools || false,
      supportsAudio: supportsAudio || false,
      supportsVideo: supportsVideo || false,
      supportsDocument: supportsDocument || false,
      costPer1kInputTokens: costPer1kInputTokens || '0',
      costPer1kOutputTokens: costPer1kOutputTokens || '0',
      isActive: true,
      metadata: metadata || {},
    };

    // Add to custom models array
    const existingModels = (providerConfig.customModels as any[]) || [];
    const updatedModels = [...existingModels, newModel];

    await updateUserProvider(user.id, provider, {
      customModels: updatedModels
    });

    return NextResponse.json({ model: newModel });
  } catch (error) {
    console.error('Error creating custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/user/models - Update a custom model (now handled via provider updates)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = await request.json();
    const { id, provider } = updateData;

    if (!id || !provider) {
      return NextResponse.json({
        error: 'Model ID and provider are required'
      }, { status: 400 });
    }

    // Get provider config
    const providerConfig = await getUserProvider(user.id, provider);
    if (!providerConfig) {
      return NextResponse.json({
        error: 'Provider not found'
      }, { status: 404 });
    }

    // Update model in custom models array
    const existingModels = (providerConfig.customModels as any[]) || [];
    const modelIndex = existingModels.findIndex(m => m.id === id);
    
    if (modelIndex === -1) {
      return NextResponse.json({
        error: 'Model not found'
      }, { status: 404 });
    }

    // Update the model
    existingModels[modelIndex] = { ...existingModels[modelIndex], ...updateData };

    await updateUserProvider(user.id, provider, {
      customModels: existingModels
    });

    return NextResponse.json({ model: existingModels[modelIndex] });
  } catch (error) {
    console.error('Error updating custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/user/models - Delete a custom model (now handled via provider updates)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');
    const provider = searchParams.get('provider');

    if (!modelId || !provider) {
      return NextResponse.json({
        error: 'Model ID and provider are required'
      }, { status: 400 });
    }

    // Get provider config
    const providerConfig = await getUserProvider(user.id, provider as ProviderType);
    if (!providerConfig) {
      return NextResponse.json({
        error: 'Provider not found'
      }, { status: 404 });
    }

    // Remove model from custom models array
    const existingModels = (providerConfig.customModels as any[]) || [];
    const filteredModels = existingModels.filter(m => m.id !== modelId);
    
    if (filteredModels.length === existingModels.length) {
      return NextResponse.json({
        error: 'Model not found'
      }, { status: 404 });
    }

    await updateUserProvider(user.id, provider as ProviderType, {
      customModels: filteredModels
    });

    return NextResponse.json({
      message: 'Model deleted successfully',
      modelId
    });
  } catch (error) {
    console.error('Error deleting custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}