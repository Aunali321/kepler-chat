import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuthUser } from './auth';
import { withErrorHandling } from './error';
import { withValidation } from './validation';
import { responses, validatePagination, createPaginationMeta } from '@/lib/utils/api-response';
import type { User } from '@/lib/db/types';

interface CrudPermissions<T> {
  list?: (user: User) => boolean | Promise<boolean>;
  create?: (user: User, data: T) => boolean | Promise<boolean>;
  read?: (user: User, id: string) => boolean | Promise<boolean>;
  update?: (user: User, id: string, data: Partial<T>) => boolean | Promise<boolean>;
  delete?: (user: User, id: string) => boolean | Promise<boolean>;
}

interface CrudOperations<T> {
  list?: (userId: string, options?: { page?: number; limit?: number; orderBy?: string; orderDirection?: 'asc' | 'desc' }) => Promise<{ items: T[]; total: number }>;
  create?: (userId: string, data: T) => Promise<T>;
  read?: (userId: string, id: string) => Promise<T | null>;
  update?: (userId: string, id: string, data: Partial<T>) => Promise<T | null>;
  delete?: (userId: string, id: string) => Promise<boolean>;
}

interface CrudTransforms<T> {
  input?: (data: any) => T;
  output?: (data: T) => any;
  list?: (items: T[]) => any[];
}

interface CrudConfig<T> {
  createSchema?: z.ZodSchema<T>;
  updateSchema?: z.ZodSchema<Partial<T>>;
  querySchema?: z.ZodSchema<any>;
  permissions?: CrudPermissions<T>;
  operations: CrudOperations<T>;
  transforms?: CrudTransforms<T>;
  resourceName?: string;
}

/**
 * Creates a complete CRUD API handler set
 */
export function createCrudRoutes<T>(config: CrudConfig<T>) {
  const resourceName = config.resourceName || 'resource';

  // List/Get all resources
  const listHandler = async (req: NextRequest, user: User) => {
    if (!config.operations.list) {
      return responses.notFound(`${resourceName} listing not supported`);
    }

    // Check permissions
    if (config.permissions?.list) {
      const hasPermission = await config.permissions.list(user);
      if (!hasPermission) {
        return responses.forbidden();
      }
    }

    // Parse query parameters
    const url = new URL(req.url);
    const rawPage = url.searchParams.get('page');
    const rawLimit = url.searchParams.get('limit');
    const orderBy = url.searchParams.get('orderBy') || undefined;
    const orderDirection = (url.searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc';

    const { page, limit } = validatePagination(
      rawPage ? parseInt(rawPage) : undefined,
      rawLimit ? parseInt(rawLimit) : undefined
    );

    // Fetch data
    const result = await config.operations.list(user.id, {
      page,
      limit,
      orderBy,
      orderDirection
    });

    // Transform output if needed
    const items = config.transforms?.list 
      ? config.transforms.list(result.items)
      : result.items;

    // Create pagination metadata
    const pagination = createPaginationMeta(page, limit, result.total);

    return responses.paginated(items, pagination);
  };

  // Create new resource
  const createHandler = async (req: NextRequest, user: User, { body }: { body: T }) => {
    if (!config.operations.create) {
      return responses.notFound(`${resourceName} creation not supported`);
    }

    // Transform input if needed
    const data = config.transforms?.input ? config.transforms.input(body) : body;

    // Check permissions
    if (config.permissions?.create) {
      const hasPermission = await config.permissions.create(user, data);
      if (!hasPermission) {
        return responses.forbidden();
      }
    }

    // Create resource
    const created = await config.operations.create(user.id, data);

    // Transform output if needed
    const output = config.transforms?.output ? config.transforms.output(created) : created;

    return responses.created(output);
  };

  // Read single resource
  const readHandler = async (req: NextRequest, user: User, context: any) => {
    if (!config.operations.read) {
      return responses.notFound(`${resourceName} reading not supported`);
    }

    const id = context.params?.id;
    if (!id) {
      return responses.badRequest('Resource ID is required');
    }

    // Check permissions
    if (config.permissions?.read) {
      const hasPermission = await config.permissions.read(user, id);
      if (!hasPermission) {
        return responses.forbidden();
      }
    }

    // Fetch resource
    const resource = await config.operations.read(user.id, id);
    if (!resource) {
      return responses.notFound(`${resourceName} not found`);
    }

    // Transform output if needed
    const output = config.transforms?.output ? config.transforms.output(resource) : resource;

    return responses.ok(output);
  };

  // Update resource
  const updateHandler = async (req: NextRequest, user: User, context: any) => {
    if (!config.operations.update) {
      return responses.notFound(`${resourceName} updating not supported`);
    }

    const id = context.params?.id;
    const data = context.body;

    if (!id) {
      return responses.badRequest('Resource ID is required');
    }

    // Transform input if needed
    const updateData = config.transforms?.input ? config.transforms.input(data) : data;

    // Check permissions
    if (config.permissions?.update) {
      const hasPermission = await config.permissions.update(user, id, updateData);
      if (!hasPermission) {
        return responses.forbidden();
      }
    }

    // Update resource
    const updated = await config.operations.update(user.id, id, updateData);
    if (!updated) {
      return responses.notFound(`${resourceName} not found`);
    }

    // Transform output if needed
    const output = config.transforms?.output ? config.transforms.output(updated) : updated;

    return responses.updated(output);
  };

  // Delete resource
  const deleteHandler = async (req: NextRequest, user: User, context: any) => {
    if (!config.operations.delete) {
      return responses.notFound(`${resourceName} deletion not supported`);
    }

    const id = context.params?.id;
    if (!id) {
      return responses.badRequest('Resource ID is required');
    }

    // Check permissions
    if (config.permissions?.delete) {
      const hasPermission = await config.permissions.delete(user, id);
      if (!hasPermission) {
        return responses.forbidden();
      }
    }

    // Delete resource
    const deleted = await config.operations.delete(user.id, id);
    if (!deleted) {
      return responses.notFound(`${resourceName} not found`);
    }

    return responses.deleted();
  };

  // Return configured route handlers
  return {
    // List resources (GET /)
    GET: config.operations.list
      ? withErrorHandling(withAuthUser(listHandler))
      : undefined,

    // Create resource (POST /)
    POST: config.operations.create && config.createSchema
      ? withErrorHandling(
          withAuthUser(
            withValidation({ body: config.createSchema })(createHandler)
          )
        )
      : undefined,

    // Read single resource (GET /[id])
    READ: config.operations.read
      ? withErrorHandling(withAuthUser(readHandler))
      : undefined,

    // Update resource (PUT /[id])
    PUT: config.operations.update && config.updateSchema
      ? withErrorHandling(
          withAuthUser(
            withValidation({ body: config.updateSchema })(updateHandler)
          )
        )
      : undefined,

    // Delete resource (DELETE /[id])
    DELETE: config.operations.delete
      ? withErrorHandling(withAuthUser(deleteHandler))
      : undefined,
  };
}

/**
 * Creates a simplified CRUD handler for basic operations
 */
export function createSimpleCrudRoutes<T>(
  operations: CrudOperations<T>,
  schemas: {
    create?: z.ZodSchema<T>;
    update?: z.ZodSchema<Partial<T>>;
  },
  resourceName?: string
) {
  return createCrudRoutes({
    operations,
    createSchema: schemas.create,
    updateSchema: schemas.update,
    resourceName,
    permissions: {
      // Default: user can only access their own resources
      list: () => true,
      create: () => true,
      read: () => true,
      update: () => true,
      delete: () => true,
    },
  });
}

/**
 * Middleware composer for common CRUD patterns
 */
export function createCrudMiddleware() {
  return {
    withAuth: withAuthUser,
    withValidation,
    withErrorHandling,
    responses,
  };
}