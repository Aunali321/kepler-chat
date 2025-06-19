import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import type { User } from '@/lib/db/types';

type OptionalAuthHandler = (
  req: NextRequest, 
  user: User | null, 
  context?: any
) => Promise<Response>;

/**
 * Middleware that provides optional authentication
 * The handler receives user as null if not authenticated, otherwise the user object
 */
export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    try {
      // Try to get current user, but don't fail if not authenticated
      const user = await getCurrentUser();
      
      return await handler(req, user, context);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // If auth fails, continue with null user
      return await handler(req, null, context);
    }
  };
}