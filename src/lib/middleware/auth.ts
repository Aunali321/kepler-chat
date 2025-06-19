import { requireAuthApi } from '@/lib/auth-server';
import { NextRequest } from 'next/server';

type AuthenticatedRequest = NextRequest & {
  user: { id: string; email: string; name?: string };
};

type RouteHandler = (req: AuthenticatedRequest, context?: any) => Promise<Response>;

/**
 * Higher-order function that wraps API route handlers with authentication
 * Eliminates the need to duplicate auth logic across all API routes
 */
export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    try {
      const authResult = await requireAuthApi();
      
      if ('error' in authResult) {
        return new Response(authResult.error, { status: authResult.status });
      }

      const { user } = authResult;
      
      // Add user to request object for the handler
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      return await handler(authenticatedReq, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response('Authentication failed', { status: 500 });
    }
  };
}

/**
 * Alternative auth wrapper that provides user as a parameter instead of attaching to request
 */
export function withAuthUser<T = any>(handler: (req: NextRequest, user: { id: string; email: string; name?: string }, context?: T) => Promise<Response>) {
  return async (req: NextRequest, context?: T): Promise<Response> => {
    try {
      const authResult = await requireAuthApi();
      
      if ('error' in authResult) {
        return new Response(authResult.error, { status: authResult.status });
      }

      const { user } = authResult;
      
      return await handler(req, user, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response('Authentication failed', { status: 500 });
    }
  };
}