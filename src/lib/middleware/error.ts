import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError } from './validation';
import { handleApiError } from '@/lib/utils/api-response';

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

      // Handle custom error types
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            ...(error.details && { details: error.details })
          }, 
          { status: 400 }
        );
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json(
          { success: false, error: error.message }, 
          { status: 404 }
        );
      }

      // Handle standard Error types
      if (error instanceof Error) {
        // API key errors
        if (error.message.includes('API key')) {
          return NextResponse.json(
            { success: false, error: 'AI provider not configured' }, 
            { status: 503 }
          );
        }
        
        // Not found errors
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { success: false, error: 'Resource not found' }, 
            { status: 404 }
          );
        }

        // Validation errors
        if (error.message.includes('validation') || error.message.includes('Invalid')) {
          return NextResponse.json(
            { success: false, error: error.message }, 
            { status: 400 }
          );
        }

        // Auth errors
        if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized' }, 
            { status: 401 }
          );
        }

        // Return the error message for other known errors
        return NextResponse.json(
          { success: false, error: error.message }, 
          { status: 500 }
        );
      }

      // Generic error response
      return NextResponse.json(
        { success: false, error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Combines auth and error handling middleware
 */
export function withMiddleware(authHandler: RouteHandler) {
  return withErrorHandling(authHandler);
}