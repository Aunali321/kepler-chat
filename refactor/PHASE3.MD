# Phase 3: Database Cleanup - Schema Simplification & Query Optimization

## Current Database Problems

### Issue 1: Redundant Tables (BetterAuth Overlap)
- **Problem**: Redefining `users`, `sessions`, `accounts` when BetterAuth handles these
- **Impact**: Maintenance overhead, data sync issues, complexity

### Issue 2: Over-normalized Structure  
- **Problem**: 5+ tables for user settings that could be 1-2 tables
- **Impact**: Complex joins, N+1 queries, slow performance

### Issue 3: N+1 Query Patterns
- **Problem**: Multiple separate queries where one would suffice
- **Impact**: Poor performance, especially in `getChatWithMessages`

### Issue 4: Missing Indexes
- **Problem**: Searches and lookups without proper indexes
- **Impact**: Slow queries as data grows

---

## PHASE 3A: Remove Redundant Tables

### Tables to Delete (BetterAuth handles these):

#### 1. `users` table
**Current location**: `src/lib/db/schema.ts:8-16`

```sql
-- DELETE THIS - BetterAuth creates its own users table
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ... rest of fields
});
```

#### 2. `sessions` table  
**Current location**: `src/lib/db/schema.ts:18-28`

#### 3. `account` table
**Current location**: `src/lib/db/schema.ts:30-45`

#### 4. `verification` table
**Current location**: `src/lib/db/schema.ts:280-290`

### Instructions for Claude:

**Context**: This Next.js app uses BetterAuth for authentication. BetterAuth automatically creates and manages user, session, and account tables. The current schema redundantly defines these tables.

**Task**: Clean up authentication tables:

1. **Remove from schema.ts**:
   - Delete `users` table definition
   - Delete `sessions` table definition  
   - Delete `account` table definition
   - Delete `verification` table definition

2. **Update references**:
   - Find all foreign key references to `users.id`
   - Update to reference BetterAuth's user table format
   - Test that BetterAuth still works correctly

3. **Migration strategy**:
   - Create migration to drop redundant tables
   - Ensure data is migrated to BetterAuth tables first
   - Provide rollback strategy

**Expected outcome**: Remove 100+ lines from schema, eliminate sync issues

---

## PHASE 3B: Consolidate User Setting Tables

### Current Problem: 4 Tables for User Settings

```typescript
// TOO MANY TABLES FOR USER SETTINGS:
userPreferences       // Theme, language, etc.
userApiKeys          // Provider API keys  
userCustomModels     // Custom model configs
userProviderPreferences // Provider settings
```

### New Simplified Structure:

#### Option 1: Consolidate to 2 Tables
```sql
-- Table 1: User Settings (JSON column)
user_settings {
  user_id: varchar (FK to BetterAuth users)
  preferences: jsonb  -- theme, language, UI settings
  chat_settings: jsonb -- chat-specific settings
  notification_settings: jsonb -- notification prefs
}

-- Table 2: Provider Configurations  
user_providers {
  user_id: varchar (FK)
  provider: varchar -- 'openai', 'anthropic', etc.
  encrypted_api_key: text
  is_enabled: boolean
  default_model: varchar
  custom_models: jsonb -- array of custom model configs
  settings: jsonb -- provider-specific settings
}
```

### Instructions for Claude:

**Context**: The current database has 4+ separate tables for user settings, causing complex queries and maintenance overhead. PostgreSQL's JSONB support makes consolidation efficient.

**Task**: Consolidate user setting tables:

1. **Create new schema**:
   - Design `user_settings` table with JSONB columns
   - Design `user_providers` table combining API keys + preferences
   - Add proper indexes for JSONB queries

2. **Create migration**:
   - Migrate data from 4 old tables to 2 new tables
   - Preserve all existing data
   - Add validation for JSONB structure

3. **Update queries**:
   - Rewrite all queries in `src/lib/db/queries.ts`
   - Use JSONB operators for efficient lookups
   - Maintain same API interface for components

4. **Delete old tables**:
   - `userPreferences`
   - `userApiKeys` 
   - `userCustomModels`
   - `userProviderPreferences`

**Expected outcome**: Reduce user setting tables from 4 to 2, simpler queries

---

## PHASE 3C: Fix N+1 Query Problems

### Critical Issue: `getChatWithMessages` N+1 Pattern

**Current code** (`src/lib/db/queries.ts:70-85`):
```typescript
export async function getChatWithMessages(chatId: string, userId: string): Promise<ChatWithMessages | null> {
  const chat = await getChatById(chatId, userId);        // Query 1
  if (!chat) return null;
  
  const chatMessages = await getMessagesByChatId(chatId); // Query 2 
  
  return {
    ...chat,
    messages: chatMessages,
  };
}
```

**Problem**: 2 separate queries when 1 optimized query would work

### Instructions for Claude:

**Context**: This function is called frequently and causes performance issues. It should use a single query with proper joins.

**Task**: Optimize `getChatWithMessages`:

1. **Rewrite as single query**:
   ```typescript
   // Use JOIN to get chat + messages in one query
   const result = await db
     .select({
       chat: chats,
       message: messages,
     })
     .from(chats)
     .leftJoin(messages, eq(messages.chatId, chats.id))
     .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
     .orderBy(asc(messages.createdAt));
   ```

2. **Handle result mapping**:
   - Group messages under chat object
   - Handle empty message arrays
   - Maintain same return type

3. **Add performance indexes**:
   - Composite index on `(chats.userId, chats.id)`
   - Index on `(messages.chatId, messages.createdAt)`

**Expected outcome**: Reduce 2 queries to 1, significantly faster loading

---

## PHASE 3D: Add Missing Indexes

### Performance Issues: Missing Database Indexes

**Current slow queries** (found in usage):
1. Chat search by title: `ILIKE '%query%'` on `chats.title`
2. Message search by content: `ILIKE '%query%'` on `messages.content`  
3. User chat lookup: `WHERE userId = ?` on large chat tables
4. File lookup by chat: `WHERE chatId = ?` on files table

### Instructions for Claude:

**Context**: As the application grows, search and lookup queries become slow without proper indexes.

**Task**: Add strategic indexes:

1. **Search indexes**:
   ```sql
   -- Full-text search on chat titles
   CREATE INDEX idx_chats_title_search ON chats USING gin(to_tsvector('english', title));
   
   -- Full-text search on message content  
   CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));
   ```

2. **Lookup indexes**:
   ```sql
   -- User chat lookups (most common query)
   CREATE INDEX idx_chats_user_updated ON chats(user_id, updated_at DESC);
   
   -- Message chat lookups
   CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at ASC);
   
   -- File chat lookups
   CREATE INDEX idx_files_chat_created ON files(chat_id, created_at DESC);
   ```

3. **Composite indexes** for common query patterns:
   ```sql
   -- Chat listing with filters
   CREATE INDEX idx_chats_user_filters ON chats(user_id, is_archived, is_pinned, updated_at DESC);
   ```

**Expected outcome**: 10x faster search queries, smooth pagination

---

## PHASE 3E: Optimize Query Functions

### Current Problems in `queries.ts`:

#### 1. **Inefficient Pagination**
- No LIMIT/OFFSET patterns
- Loading all data always

#### 2. **Missing Batch Operations**
- Creating messages one-by-one
- No bulk insert patterns

#### 3. **Redundant Queries**
- Same data fetched multiple times
- No caching at database level

### Instructions for Claude:

**Context**: The `src/lib/db/queries.ts` file has many inefficient patterns that work fine in development but will fail under load.

**Task**: Optimize query patterns:

1. **Add pagination**:
   ```typescript
   export async function getChatsByUserId(
     userId: string, 
     options: { limit?: number; offset?: number; cursor?: string } = {}
   ) {
     const { limit = 50, offset = 0 } = options;
     
     return await db
       .select()
       .from(chats)
       .where(eq(chats.userId, userId))
       .orderBy(desc(chats.updatedAt))
       .limit(limit)
       .offset(offset);
   }
   ```

2. **Add batch operations**:
   ```typescript
   export async function createMessages(messages: NewMessage[]) {
     return await db.insert(messages).values(messages).returning();
   }
   ```

3. **Add query result caching**:
   - Use Next.js `unstable_cache` for static data
   - Cache user preferences, provider configs
   - Cache chat metadata (not messages)

**Expected outcome**: Support for thousands of chats/messages per user

---

## MIGRATION STRATEGY

### Step 1: Schema Migration (Week 3, Day 1-2)
1. Create migration files for new consolidated schema
2. Test migration on development copy of database
3. Create rollback procedures

### Step 2: Query Updates (Week 3, Day 3-4)
1. Update all query functions to use new schema
2. Add proper indexes
3. Test performance with realistic data

### Step 3: Component Updates (Week 3, Day 5)
1. Update components to use new query patterns
2. Add pagination to chat/message lists
3. Test all CRUD operations

### Step 4: Production Migration (Week 4)
1. Deploy schema changes during low-traffic period
2. Monitor performance improvements
3. Rollback plan ready if issues arise

---

## VERIFICATION CHECKLIST

### Schema Cleanup:
- [ ] BetterAuth tables no longer redefined
- [ ] User settings consolidated to 2 tables  
- [ ] All foreign keys updated correctly
- [ ] Migration scripts tested and working

### Query Optimization:
- [ ] `getChatWithMessages` uses single query
- [ ] N+1 patterns eliminated throughout codebase
- [ ] Proper indexes added for all search functions
- [ ] Pagination added to list functions

### Performance:
- [ ] Chat list loads <100ms with 1000+ chats
- [ ] Message search completes <200ms  
- [ ] No slow query warnings in logs
- [ ] Database size reduced by eliminating redundancy

## Expected Performance Improvements

### Before:
- Chat list: 500ms+ with 100+ chats
- Message search: 2+ seconds
- Complex settings queries: Multiple round trips

### After:  
- Chat list: <100ms with 1000+ chats
- Message search: <200ms full-text search
- Settings: Single query for all user data
- 50% reduction in database calls
- 70% faster overall query performance