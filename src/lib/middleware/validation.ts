import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

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

type ValidatedHandler<TBody = any, TQuery = any, TParams = any> = (
  req: NextRequest,
  context: ValidationContext<TBody, TQuery, TParams>,
  ...args: any[]
) => Promise<Response>;

/**
 * Higher-order function that wraps API route handlers with request validation
 * Validates request body, query parameters, and path parameters using Zod schemas
 */
export function withValidation<TBody = any, TQuery = any, TParams = any>(
  schemas: ValidationSchemas<TBody, TQuery, TParams>
) {
  return function<T extends any[]>(
    handler: ValidatedHandler<TBody, TQuery, TParams>
  ) {
    return async (req: NextRequest, ...args: T): Promise<Response> => {
      try {
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

        return await handler(req, validated, ...args);
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
 * Simplified validation for body-only requests
 */
export function withBodyValidation<TBody>(schema: z.ZodSchema<TBody>) {
  return withValidation({ body: schema });
}

/**
 * Simplified validation for query-only requests
 */
export function withQueryValidation<TQuery>(schema: z.ZodSchema<TQuery>) {
  return withValidation({ query: schema });
}

/**
 * Simplified validation for params-only requests
 */
export function withParamsValidation<TParams>(schema: z.ZodSchema<TParams>) {
  return withValidation({ params: schema });
}