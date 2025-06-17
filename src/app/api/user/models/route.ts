import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import {
  getUserCustomModels,
  createUserCustomModel,
  updateUserCustomModel,
  deleteUserCustomModel
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

    const models = await getUserCustomModels(user.id, provider);

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching custom models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/user/models - Create a new custom model
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

    // Validate provider type
    const validProviders: ProviderType[] = [
      'openai', 'anthropic', 'google', 'openrouter', 'deepseek', 'togetherai', 'groq', 'mistral'
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json({
        error: 'Invalid provider'
      }, { status: 400 });
    }

    const model = await createUserCustomModel({
      userId: user.id,
      provider,
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
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error('Error creating custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/user/models - Update a custom model
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      id,
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
      isActive,
      metadata
    } = await request.json();

    if (!id) {
      return NextResponse.json({
        error: 'Model ID is required'
      }, { status: 400 });
    }

    const updatedModel = await updateUserCustomModel(user.id, id, {
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
      isActive,
      metadata,
    });

    if (!updatedModel) {
      return NextResponse.json({
        error: 'Model not found'
      }, { status: 404 });
    }

    return NextResponse.json({ model: updatedModel });
  } catch (error) {
    console.error('Error updating custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/user/models - Delete a custom model
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({
        error: 'Model ID is required'
      }, { status: 400 });
    }

    const deletedModel = await deleteUserCustomModel(user.id, modelId);

    if (!deletedModel) {
      return NextResponse.json({
        error: 'Model not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Model deleted successfully',
      modelId
    });
  } catch (error) {
    console.error('Error deleting custom model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}