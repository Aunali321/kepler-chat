# Phase 1: Emergency Fixes - Critical Security and Memory Issues

## CRITICAL ISSUE 1: ProviderManager Memory Leak & Security Risk

### Location: `src/lib/provider-manager.ts`

### Problem:
```typescript
export class ProviderManager {
  private static instance: ProviderManager; // SINGLETON WITH USER DATA!
  private userApiKeys: Map<ProviderType, string> = new Map(); // USER SECRETS IN MEMORY!
  private userPreferences: Map<ProviderType, any> = new Map();
  private userCustomModels: Map<ProviderType, ModelConfig[]> = new Map();
}
```

**Why this is critical:**
1. **Memory Leak**: Singleton holds user data across sessions
2. **Security Risk**: API keys stored in global memory
3. **Data Contamination**: Different users can access each other's data

### Instructions for Claude:
**Context**: This is a Next.js app with BetterAuth for authentication. The ProviderManager is meant to handle AI provider configurations (OpenAI, Anthropic, etc.) for individual users.

**Task**: Rewrite the ProviderManager to be stateless and user-scoped. Remove singleton pattern entirely. Create a functional approach that:
1. Takes userId as parameter for all functions
2. Fetches data fresh from database when needed
3. Uses Next.js caching for performance instead of in-memory Maps
4. Never stores user secrets in memory

**Files to modify:**
- `src/lib/provider-manager.ts` (complete rewrite)
- Any imports of `providerManager.getInstance()` throughout codebase

**Expected outcome**: Replace 600-line class with ~100 lines of functional code.

---

## CRITICAL ISSUE 2: Delete Unused Files

### Files to Delete Completely:

#### 1. `src/lib/hooks/use-file-upload.ts`
**Why**: Never imported anywhere, functionality duplicated in `file-upload.ts`

#### 2. `src/components/file-upload.tsx` 
**Why**: Complex 200-line component never used, functionality exists in `chat-input.tsx`

#### 3. `src/lib/stores/password-store.ts`
**Why**: 80 lines just for showing/hiding passwords - massive overkill

#### 4. `src/components/layout/responsive-layout.tsx`
**Why**: Never imported, layout handled elsewhere

#### 5. `src/lib/file-processing.ts`
**Why**: Functions overlap with `file-upload.ts`, causing confusion

### Instructions for Claude:
**Task**: 
1. Verify these files are truly unused by searching imports
2. Delete the files entirely
3. If any imports are found, provide alternative implementations
4. Update any TypeScript references

---

## CRITICAL ISSUE 3: Race Condition in Preferences Store

### Location: `src/lib/stores/preferences-store.ts`

### Problem:
```typescript
// Track if preferences are being loaded to prevent duplicate requests
let isLoadingPreferences = false; // GLOBAL STATE IN MODULE SCOPE!

export const usePreferencesStore = create<PreferencesState>()(
  immer((set, get) => ({
    loadPreferences: async () => {
      // Prevent duplicate requests if already loading or already loaded
      if (isLoadingPreferences || get().preferences) {
        return;
      }
      isLoadingPreferences = true; // RACE CONDITION!
      // ...
    }
  }))
);
```

**Why this is critical:**
1. **Race Condition**: Multiple components can trigger loading simultaneously
2. **Memory Leak**: Global variable never gets cleaned up properly
3. **State Corruption**: Loading state can get stuck

### Instructions for Claude:
**Context**: This Zustand store manages user preferences. The race condition happens when multiple components try to load preferences simultaneously.

**Task**: Fix the race condition by:
1. Moving loading state inside the store (not module scope)
2. Using proper async/await patterns
3. Adding proper cleanup and error handling
4. Ensuring the store can handle concurrent access

---

## CRITICAL ISSUE 4: Authentication Duplication

### Problem: Auth check duplicated 15+ times across API routes

### Example locations:
- `src/app/api/chat/route.ts`
- `src/app/api/providers/route.ts`
- `src/app/api/user/api-keys/route.ts`
- `src/app/api/files/[fileId]/route.ts`
- And 10+ more files

### Duplicated Pattern:
```typescript
// This exact pattern appears everywhere:
const authResult = await requireAuthApi();
if ('error' in authResult) {
  return new Response(authResult.error, { status: authResult.status });
}
const { user } = authResult;
```

### Instructions for Claude:
**Context**: This is a Next.js 14 app with app directory. Every API route needs authentication but it's copy-pasted everywhere.

**Task**: Create a higher-order function or middleware pattern to eliminate duplication:
1. Create `src/lib/middleware/auth.ts` with `withAuth()` wrapper
2. Create `src/lib/middleware/error.ts` with `withErrorHandling()` wrapper  
3. Update all API routes to use the new pattern
4. Reduce 20+ lines of auth code per route to 1-2 lines

**Expected pattern:**
```typescript
export const GET = withAuth(withErrorHandling(async (req, { user }) => {
  // Clean handler code here
}));
```

---

## CRITICAL ISSUE 5: Missing Error Boundaries

### Problem: No React error boundaries in the app

### Locations needing error boundaries:
- `src/app/layout.tsx` (root level)
- `src/components/chat/chat-interface.tsx` (chat errors)
- `src/components/settings/provider-settings.tsx` (API errors)

### Instructions for Claude:
**Context**: This is a Next.js React app that makes many API calls and handles file uploads. Users report white screens when errors occur.

**Task**: Create and implement error boundaries:
1. Create `src/components/ui/error-boundary.tsx` - generic error boundary
2. Create `src/components/ui/api-error-boundary.tsx` - API-specific errors
3. Wrap components appropriately
4. Add proper error reporting and user feedback
5. Include retry mechanisms where appropriate

---

## VERIFICATION CHECKLIST

After implementing these fixes, verify:

- [ ] ProviderManager no longer uses singleton pattern
- [ ] No user data stored in global memory
- [ ] All specified files are deleted
- [ ] No broken imports remain
- [ ] Race condition in preferences store is fixed
- [ ] Auth middleware reduces code duplication
- [ ] Error boundaries catch and display errors properly
- [ ] Memory usage is stable (no leaks)
- [ ] No security warnings in browser console

## Testing Instructions

### 1. Memory Leak Test:
- Open app in multiple browser tabs with different users
- Monitor memory usage in DevTools
- Should not continuously grow

### 2. Race Condition Test:
- Open multiple tabs and reload simultaneously
- Preferences should load correctly in all tabs
- No stuck loading states

### 3. Error Boundary Test:
- Simulate API failures (disconnect network)
- Should show user-friendly error messages
- Should offer retry options

### 4. Security Test:
- Inspect browser memory/network tools
- API keys should not appear in client-side code
- User data should not leak between sessions