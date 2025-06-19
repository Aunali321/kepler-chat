import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/middleware/error';
import { authMiddleware } from '@/lib/middleware/composed';
import { responses } from '@/lib/utils/api-response';
import { userPreferencesSchema } from '@/lib/schemas/api';
import { 
  getOrCreateUserSettings,
  updateUserSettings
} from '@/lib/db/queries';
import type { User } from '@/lib/db/types';

async function getHandler(
  request: NextRequest, 
  user: User
) {
  const preferences = await getOrCreateUserSettings(user.id);
  return responses.ok({ preferences });
}

async function putHandler(
  request: NextRequest, 
  user: User, 
  { body }: { body: typeof userPreferencesSchema._type }
) {
  const preferences = await updateUserSettings(user.id, { preferences: body });
  if (!preferences) {
    throw new Error('Failed to update preferences');
  }

  return responses.updated({ preferences });
}

export const GET = withErrorHandling(
  authMiddleware.only(getHandler)
);

export const PUT = withErrorHandling(
  authMiddleware.withBody(userPreferencesSchema)(putHandler)
);