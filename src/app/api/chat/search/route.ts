import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthUser } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/middleware/error';
import { searchChatsAndMessages } from '@/lib/db/queries';

const searchSchema = z.object({
  query: z.string().min(1).max(255),
  limit: z.number().min(1).max(100).optional().default(30),
});

async function getHandler(request: NextRequest, user: { id: string; email: string; name?: string }) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = parseInt(searchParams.get('limit') || '30');

  if (!query) {
    throw new Error('Query parameter is required');
  }

  const validatedData = searchSchema.parse({ query, limit });
  const results = await searchChatsAndMessages(user.id, validatedData.query, { limit: validatedData.limit });

  return NextResponse.json(results);
}

export const GET = withErrorHandling(withAuthUser(getHandler));