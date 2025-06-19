import { NextRequest } from 'next/server';

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

/**
 * Higher-order function that wraps API route handlers with error handling
 * Provides consistent error response format across all API routes
 */
export function withErrorHandling(handler: RouteHandler) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API route error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        // API key errors
        if (error.message.includes('API key')) {
          return new Response('AI provider not configured', { status: 503 });
        }
        
        // Not found errors
        if (error.message.includes('not found')) {
          return new Response('Resource not found', { status: 404 });
        }

        // Validation errors
        if (error.message.includes('validation') || error.message.includes('Invalid')) {
          return new Response(error.message, { status: 400 });
        }

        // Auth errors
        if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
          return new Response('Unauthorized', { status: 401 });
        }

        // Return the error message for other known errors
        return new Response(error.message, { status: 500 });
      }

      // Generic error response
      return new Response('Internal server error', { status: 500 });
    }
  };
}

/**
 * Combines auth and error handling middleware
 */
export function withMiddleware(authHandler: RouteHandler) {
  return withErrorHandling(authHandler);
}