/**
 * Middleware composition utilities
 * Exports all middleware functions and common patterns for API routes
 */

export { withAuth, withAuthUser } from './auth';
export { withErrorHandling } from './error';
export { withValidation, withBodyValidation, withQueryValidation, withParamsValidation, ValidationError, NotFoundError } from './validation';
export { withOptionalAuth } from './optional-auth';
export { createCrudRoutes, createSimpleCrudRoutes, createCrudMiddleware } from './crud';
export { withAuthAndValidation, withAuthOnly, authMiddleware } from './composed';

// Response utilities
export { responses, RESPONSE_MESSAGES } from '@/lib/utils/api-response';

/**
 * Type-safe route handler types
 */
export type AuthenticatedHandler<TContext = {}> = (
  req: Request,
  user: { id: string; email: string; name?: string },
  context?: TContext
) => Promise<Response>;

export type ValidatedHandler<TBody = any, TQuery = any, TParams = any> = (
  req: Request,
  user: { id: string; email: string; name?: string },
  context: { body: TBody; query: TQuery; params: TParams }
) => Promise<Response>;

export type OptionalAuthHandler = (
  req: Request,
  user: { id: string; email: string; name?: string } | null,
  context?: any
) => Promise<Response>;