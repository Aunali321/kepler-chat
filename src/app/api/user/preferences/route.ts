import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { 
  getOrCreateUserSettings,
  updateUserSettings
} from '@/lib/db/queries';

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().max(10).optional(),
  chatSettings: z.record(z.any()).optional(),
  uiSettings: z.record(z.any()).optional(),
  notificationSettings: z.record(z.any()).optional(),
});

async function getHandler(req: Request, user: { id: string; email: string; name?: string }) {
  const preferences = await getOrCreateUserSettings(user.id);
  return NextResponse.json({ preferences });
}

async function putHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  const body = await request.json();
  const validatedData = updatePreferencesSchema.parse(body);

  const preferences = await updateUserSettings(user.id, { preferences: validatedData });
  if (!preferences) {
    throw new Error('Failed to update preferences');
  }

  return NextResponse.json({ preferences });
}

export const GET = withErrorHandling(withAuthUser(getHandler));
export const PUT = withErrorHandling(withAuthUser(putHandler));