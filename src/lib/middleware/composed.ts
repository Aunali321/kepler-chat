import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthApi } from '@/lib/auth-server';
import { ValidationError } from './validation';
import type { User } from '@/lib/db/types';

interface ValidationSchemas<TBody = any, TQuery = any, TParams = any> {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
}

interface ValidationContext<TBody = any, TQuery = any, TParams = any> {
  body: TBody;
  query: TQuery;
  params: TParams;
}

type AuthValidatedHandler<TBody = any, TQuery = any, TParams = any> = (
  req: NextRequest,
  user: User,
  context: ValidationContext<TBody, TQuery, TParams>,
  ...args: any[]
) => Promise<Response>;

// Use output types for better type safety with defaults
type SchemaOutput<T> = T extends z.ZodSchema<any, any, infer Output> ? Output : T;

/**
 * Combines authentication and validation in one middleware
 */
export function withAuthAndValidation<TBody = any, TQuery = any, TParams = any>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>
) {
  return function<T extends any[]>(
    handler: AuthValidatedHandler<TBody, TQuery, TParams>
  ) {
    return async (req: NextRequest, ...args: T): Promise<Response> => {
      try {
        // First, authenticate
        const authResult = await requireAuthApi();
        if ('error' in authResult) {
          return new Response(authResult.error, { status: authResult.status });
        }
        const { user } = authResult;

        // Then, validate
        const validated: any = {};

        // Validate request body
        if (schemas.body) {
          try {
            const body = await req.json();
            validated.body = schemas.body.parse(body);
          } catch (error) {
            if (error instanceof SyntaxError) {
              throw new ValidationError('Invalid JSON in request body');
            }
            throw error;
          }
        }

        // Validate query parameters
        if (schemas.query) {
          const url = new URL(req.url);
          const query = Object.fromEntries(url.searchParams.entries());
          validated.query = schemas.query.parse(query);
        }

        // Validate path parameters (from Next.js context)
        if (schemas.params && args[0]?.params) {
          const params = await args[0].params;
          validated.params = schemas.params.parse(params);
        }

        return await handler(req, user, validated, ...args);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError('Validation failed', error.errors);
        }
        throw error;
      }
    };
  };
}

/**
 * Auth-only middleware (for handlers that don't need validation)
 */
export function withAuthOnly<T extends any[]>(
  handler: (req: NextRequest, user: User, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const authResult = await requireAuthApi();
    if ('error' in authResult) {
      return new Response(authResult.error, { status: authResult.status });
    }
    const { user } = authResult;
    return await handler(req, user, ...args);
  };
}

/**
 * Quick helpers for common patterns
 */
export const authMiddleware = {
  withQuery: <TQuery>(schema: z.ZodSchema<TQuery>) =>
    withAuthAndValidation({ query: schema }),
  
  withBody: <TBody>(schema: z.ZodSchema<TBody>) =>
    withAuthAndValidation({ body: schema }),
  
  withParams: <TParams>(schema: z.ZodSchema<TParams>) =>
    withAuthAndValidation({ params: schema }),
  
  withBodyAndQuery: <TBody, TQuery>(
    bodySchema: z.ZodSchema<TBody>,
    querySchema: z.ZodSchema<TQuery>
  ) => withAuthAndValidation({ body: bodySchema, query: querySchema }),
  
  only: withAuthOnly,
};