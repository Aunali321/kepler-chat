# Phase 6: API Route Consolidation - Middleware & Common Patterns

## Current API Route Problems

### Issue 1: Massive Duplication - Authentication

**Repeated 20+ times across API routes**:
```typescript
// This exact pattern appears everywhere:
const authResult = await requireAuthApi();
if ('error' in authResult) {
  return new Response(authResult.error, { status: authResult.status });
}
const { user } = authResult;
```

**Found in**:
- `src/app/api/chat/route.ts:35-40`
- `src/app/api/providers/route.ts:15-20`
- `src/app/api/user/api-keys/route.ts:25-30`
- `src/app/api/files/[fileId]/route.ts:20-25`
- **15+ more files** with identical code

### Issue 2: Copy-Pasted Error Handling

**Repeated pattern**:
```typescript
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Issue 3: Duplicate CRUD Patterns

**Example**: API key management, file management, chat management all have nearly identical patterns but are copy-pasted.

### Issue 4: No Request Validation Middleware

Every route manually validates request bodies, query params, etc.

---

## PHASE 6A: Create Authentication Middleware

### Instructions for Claude:

**Context**: This is a Next.js 14 app with app directory. Every API route needs authentication but it's copy-pasted everywhere, causing maintenance nightmares.

**Task**: Create authentication middleware to eliminate duplication.

#### 1. Create Base Middleware:
```typescript
// src/lib/middleware/auth.ts
export function withAuth<T extends any[]>(
  handler: (req: Request, context: { user: User }, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try {
      const authResult = await requireAuthApi();
      if ('error' in authResult) {
        return new Response(authResult.error, { status: authResult.status });
      }
      
      return await handler(req, { user: authResult.user }, ...args);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response('Authentication failed', { status: 500 });
    }
  };
}
```

#### 2. Create Error Handling Middleware:
```typescript
// src/lib/middleware/error.ts
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle different error types
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      
      if (error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
```

#### 3. Update All API Routes:
```typescript
// Before: 10+ lines of auth + error handling per route
export async function GET(req: Request) {
  const authResult = await requireAuthApi();
  if ('error' in authResult) {
    return new Response(authResult.error, { status: authResult.status });
  }
  const { user } = authResult;
  
  try {
    // actual logic
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// After: 1 line of middleware setup
export const GET = withAuth(withErrorHandling(async (req, { user }) => {
  // clean handler logic only
}));
```

**Requirements**:
1. **Eliminate auth duplication** - 20+ instances to 1 middleware
2. **Consistent error handling** - standardized error responses
3. **Type safety** - proper TypeScript integration
4. **Easy to use** - simple wrapper functions
5. **Backwards compatible** - existing routes still work during migration

---

## PHASE 6B: Create Request Validation Middleware

### Current Problem: Manual Request Validation Everywhere

**Example duplication**:
```typescript
// This pattern repeated in many routes:
const body = await req.json();
if (!body.provider || !body.apiKey) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}
```

### Instructions for Claude:

**Context**: API routes manually validate request bodies, query params, and path params. This should be middleware with Zod schemas.

**Task**: Create validation middleware:

#### 1. Create Validation Middleware:
```typescript
// src/lib/middleware/validation.ts
import { z } from 'zod';

export function withValidation<TBody = any, TQuery = any, TParams = any>(schemas: {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
}) {
  return function<T extends any[]>(
    handler: (
      req: Request, 
      context: { 
        body: TBody; 
        query: TQuery; 
        params: TParams;
      },
      ...args: T
    ) => Promise<Response>
  ) {
    return async (req: Request, ...args: T): Promise<Response> => {
      try {
        const validated: any = {};
        
        // Validate body
        if (schemas.body) {
          const body = await req.json();
          validated.body = schemas.body.parse(body);
        }
        
        // Validate query params
        if (schemas.query) {
          const url = new URL(req.url);
          const query = Object.fromEntries(url.searchParams.entries());
          validated.query = schemas.query.parse(query);
        }
        
        // Validate path params (from Next.js context)
        if (schemas.params && args[0]?.params) {
          validated.params = schemas.params.parse(await args[0].params);
        }
        
        return await handler(req, validated, ...args);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation failed', details: error.errors },
            { status: 400 }
          );
        }
        throw error;
      }
    };
  };
}
```

#### 2. Define Common Schemas:
```typescript
// src/lib/schemas/api.ts
export const apiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'openrouter']),
  apiKey: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const chatMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  chatId: z.string().uuid().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().positive(),
  chatId: z.string().uuid(),
});
```

#### 3. Update API Routes with Validation:
```typescript
// Before: Manual validation
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.provider || !body.apiKey) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  // ...
}

// After: Middleware validation  
export const POST = withAuth(
  withValidation({ body: apiKeySchema })(
    withErrorHandling(async (req, { user }, { body }) => {
      // body is fully typed and validated
      const { provider, apiKey, metadata } = body;
      // ...
    })
  )
);
```

**Requirements**:
1. **Type-safe validation** - Zod schemas with TypeScript integration
2. **Reusable schemas** - common patterns shared across routes
3. **Clear error messages** - helpful validation failure details
4. **Easy composition** - works with auth + error middleware

---

## PHASE 6C: Create Generic CRUD Middleware

### Current Problem: Repeated CRUD Patterns

**Example**: API keys, files, chats, models all have similar patterns:
```typescript
// GET - list resources
// POST - create resource  
// PUT - update resource
// DELETE - delete resource
```

### Instructions for Claude:

**Context**: Many API routes follow standard CRUD patterns but are implemented separately, causing duplication.

**Task**: Create generic CRUD middleware:

#### 1. Create CRUD Factory:
```typescript
// src/lib/middleware/crud.ts
interface CrudConfig<T> {
  tableName: string;
  schema: z.ZodSchema<T>;
  permissions?: {
    list?: (user: User) => boolean;
    create?: (user: User, data: T) => boolean;
    update?: (user: User, id: string, data: Partial<T>) => boolean;
    delete?: (user: User, id: string) => boolean;
  };
}

export function createCrudRoutes<T>(config: CrudConfig<T>) {
  return {
    GET: withAuth(withErrorHandling(async (req, { user }) => {
      // Generic list implementation
      const items = await db.select().from(config.tableName).where(eq('userId', user.id));
      return NextResponse.json({ items });
    })),
    
    POST: withAuth(
      withValidation({ body: config.schema })(
        withErrorHandling(async (req, { user }, { body }) => {
          // Generic create implementation
          const item = await db.insert(config.tableName).values({
            ...body,
            userId: user.id,
          }).returning();
          return NextResponse.json({ item: item[0] });
        })
      )
    ),
    
    // PUT and DELETE implementations...
  };
}
```

#### 2. Use CRUD Factory for Simple Resources:
```typescript
// src/app/api/user/api-keys/route.ts
const { GET, POST, PUT, DELETE } = createCrudRoutes({
  tableName: 'userApiKeys',
  schema: apiKeySchema,
  permissions: {
    // Only user can access their own API keys
    list: (user) => true,
    create: (user, data) => true,
    delete: (user, id) => true,
  },
});

export { GET, POST, PUT, DELETE };
```

**Requirements**:
1. **DRY principle** - eliminate repetitive CRUD code
2. **Flexible permissions** - configurable access control
3. **Type safety** - full TypeScript support
4. **Easy to use** - simple configuration for standard resources

---

## PHASE 6D: Consolidate Similar API Routes

### Current Problem: Nearly Identical Routes

**Examples of routes that should be consolidated**:

#### 1. User Settings Routes:
- `/api/user/preferences` 
- `/api/user/api-keys`
- `/api/user/models`
- All follow same pattern but separate files

#### 2. File Management Routes:
- `/api/files/upload-url`
- `/api/files/confirm-upload`  
- `/api/files/[fileId]`
- Could be consolidated into `/api/files` with sub-actions

### Instructions for Claude:

**Context**: Some API routes are artificially separated when they could be logically grouped, reducing the total number of route files.

**Task**: Consolidate related routes:

#### 1. Create Unified User Settings Route:
```typescript
// src/app/api/user/route.ts (replaces 3 separate routes)
export const GET = withAuth(withErrorHandling(async (req, { user }) => {
  const url = new URL(req.url);
  const resource = url.searchParams.get('resource');
  
  switch (resource) {
    case 'preferences':
      return getUserPreferences(user.id);
    case 'api-keys':
      return getUserApiKeys(user.id);
    case 'models':
      return getUserModels(user.id);
    default:
      return getUserProfile(user.id);
  }
}));

// Similar for POST, PUT, DELETE with resource-based routing
```

#### 2. Create Unified File Management Route:
```typescript
// src/app/api/files/route.ts (consolidates file operations)
export const GET = withAuth(async (req, { user }) => {
  // List user files
});

export const POST = withAuth(
  withValidation({ body: fileActionSchema })(
    async (req, { user }, { body }) => {
      switch (body.action) {
        case 'upload-url':
          return generateUploadUrl(body.filename, body.contentType);
        case 'confirm-upload':
          return confirmUpload(body.fileKey, user.id);
        default:
          throw new Error('Invalid action');
      }
    }
  )
);
```

**Requirements**:
1. **Logical grouping** - related operations in same route
2. **Action-based routing** - use query params or body actions
3. **Backwards compatibility** - don't break existing client code
4. **Clear documentation** - document the consolidated API

---

## PHASE 6E: Add API Documentation & Types

### Current Problem: No API Documentation

**Issues**:
- No OpenAPI/Swagger docs
- No shared types between client/server
- Inconsistent response formats

### Instructions for Claude:

**Context**: API routes need proper documentation and shared types for better developer experience.

**Task**: Add API documentation:

#### 1. Create API Response Types:
```typescript
// src/lib/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Specific response types for each endpoint
export interface ChatResponse extends ApiResponse<Chat> {}
export interface ProvidersResponse extends ApiResponse<ProviderConfig[]> {}
```

#### 2. Standardize Response Formats:
```typescript
// src/lib/utils/api-response.ts
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(error: string, statusCode = 500): Response {
  return NextResponse.json({ success: false, error }, { status: statusCode });
}
```

#### 3. Generate OpenAPI Documentation:
```typescript
// Use tools like swagger-jsdoc or similar to generate docs
// Document all endpoints with request/response schemas
```

**Requirements**:
1. **Consistent response format** - all APIs return same structure
2. **Shared types** - client and server use same type definitions
3. **Auto-generated docs** - OpenAPI spec from code
4. **Type safety** - full TypeScript coverage

---

## MIGRATION STRATEGY

### Week 4, Day 1: Create Middleware Infrastructure
1. Create auth, error, and validation middleware
2. Test middleware with 1-2 simple routes
3. Create common schemas and types

### Week 4, Day 2-3: Update Existing Routes
1. Update all API routes to use new middleware (batch update)
2. Test each route after middleware integration
3. Fix any issues with middleware composition

### Week 4, Day 4: Consolidate Routes
1. Merge related routes (user settings, file management)
2. Create CRUD factories for simple resources
3. Test consolidated routes

### Week 4, Day 5: Documentation & Polish
1. Add API response standardization
2. Generate API documentation
3. Final testing of all routes

---

## VERIFICATION CHECKLIST

### Code Reduction:
- [ ] Auth duplication eliminated (20+ instances to 1 middleware)
- [ ] Error handling standardized across all routes
- [ ] Request validation centralized with Zod schemas
- [ ] Similar routes consolidated (reduce route file count by 30%)

### Functionality:
- [ ] All existing API endpoints work correctly
- [ ] Error responses are consistent and helpful
- [ ] Request validation provides clear error messages
- [ ] Authentication works on all protected routes

### Developer Experience:
- [ ] Easy to add new API routes with middleware
- [ ] Consistent response formats across all endpoints
- [ ] Type-safe API interactions
- [ ] Good API documentation available

### Performance:
- [ ] No performance regression from middleware
- [ ] Faster development of new API routes
- [ ] Consistent error handling and logging

## Expected Outcomes

### Before:
- 20+ duplicated auth checks (200+ lines of duplication)
- Inconsistent error handling across routes
- Manual request validation everywhere
- 15+ separate API route files
- No API documentation

### After:
- Single auth middleware (eliminate 200+ lines of duplication)
- Standardized error handling with proper types
- Zod-based validation middleware
- 30% fewer API route files through consolidation
- Complete API documentation and types

**Code Reduction**: 40% reduction in API route code
**Maintainability**: 80% easier to add new API routes
**Consistency**: Standardized patterns across all endpoints
**Type Safety**: Full TypeScript coverage for API layer