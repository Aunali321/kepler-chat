import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import {
  customModelSchema,
  customModelUpdateSchema,
  customModelQuerySchema,
  customModelDeleteSchema
} from '@/lib/schemas/api';
import {
  getUserProviders,
  getUserProvider,
  updateUserProvider
} from '@/lib/db/queries';
import type { ProviderType, User } from '@/lib/db/types';
import { z } from 'zod';

// Infer types from schemas
type CustomModelInput = z.infer<typeof customModelSchema>;
type CustomModelUpdateInput = z.infer<typeof customModelUpdateSchema>;
type CustomModelQuery = z.infer<typeof customModelQuerySchema>;
type CustomModelDeleteQuery = z.infer<typeof customModelDeleteSchema>;

// GET /api/user/models - Get all custom models for the current user
async function getHandler(
  request: NextRequest, 
  user: User, 
  { query }: { query: CustomModelQuery }
) {
  const { provider } = query;

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

  return responses.ok({ models });
}

// POST /api/user/models - Create a new custom model
async function postHandler(
  request: NextRequest, 
  user: User, 
  { body }: { body: CustomModelInput }
) {
  const {
    provider,
    modelId,
    displayName,
    description,
    maxTokens = 4096,
    supportsVision = false,
    supportsTools = false,
    supportsAudio = false,
    supportsVideo = false,
    supportsDocument = false,
    costPer1kInputTokens = '0',
    costPer1kOutputTokens = '0',
    metadata = {}
  } = body;

  // Get provider config
  const providerConfig = await getUserProvider(user.id, provider);
  if (!providerConfig) {
    return responses.badRequest('Provider not configured. Please add API key first.');
  }

  // Build the new model object
  const newModel = {
    id: crypto.randomUUID(),
    modelId,
    displayName,
    description: description || null,
    maxTokens,
    supportsVision,
    supportsTools,
    supportsAudio,
    supportsVideo,
    supportsDocument,
    costPer1kInputTokens,
    costPer1kOutputTokens,
    isActive: true,
    metadata,
  };

  // Add to custom models array
  const existingModels = (providerConfig.customModels as any[]) || [];
  const updatedModels = [...existingModels, newModel];

  await updateUserProvider(user.id, provider, {
    customModels: updatedModels
  });

  return responses.created({ model: newModel });
}

// PUT /api/user/models - Update a custom model
async function putHandler(
  request: NextRequest, 
  user: User, 
  { body }: { body: CustomModelUpdateInput }
) {
  const { id, provider, ...updateData } = body;

  // Get provider config
  const providerConfig = await getUserProvider(user.id, provider);
  if (!providerConfig) {
    return responses.notFound('Provider not found');
  }

  // Update model in custom models array
  const existingModels = (providerConfig.customModels as any[]) || [];
  const modelIndex = existingModels.findIndex(m => m.id === id);
  
  if (modelIndex === -1) {
    return responses.notFound('Model not found');
  }

  // Update the model
  existingModels[modelIndex] = { ...existingModels[modelIndex], ...updateData };

  await updateUserProvider(user.id, provider, {
    customModels: existingModels
  });

  return responses.updated({ model: existingModels[modelIndex] });
}

// DELETE /api/user/models - Delete a custom model
async function deleteHandler(
  request: NextRequest, 
  user: User, 
  { query }: { query: CustomModelDeleteQuery }
) {
  const { id: modelId, provider } = query;

  // Get provider config
  const providerConfig = await getUserProvider(user.id, provider);
  if (!providerConfig) {
    return responses.notFound('Provider not found');
  }

  // Remove model from custom models array
  const existingModels = (providerConfig.customModels as any[]) || [];
  const filteredModels = existingModels.filter(m => m.id !== modelId);
  
  if (filteredModels.length === existingModels.length) {
    return responses.notFound('Model not found');
  }

  await updateUserProvider(user.id, provider, {
    customModels: filteredModels
  });

  return responses.deleted('Model deleted successfully');
}

// Export handlers with composed middleware
export const GET = withErrorHandling(
  authMiddleware.withQuery(customModelQuerySchema)(getHandler)
);

export const POST = withErrorHandling(
  authMiddleware.withBody(customModelSchema)(postHandler)
);

export const PUT = withErrorHandling(
  authMiddleware.withBody(customModelUpdateSchema)(putHandler)
);

export const DELETE = withErrorHandling(
  authMiddleware.withQuery(customModelDeleteSchema)(deleteHandler)
);