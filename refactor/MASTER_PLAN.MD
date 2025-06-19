# Master Refactoring Plan - Kepler Chat Codebase Cleanup

## Current State Analysis
- **Total Files**: ~70+ files
- **Estimated Lines**: ~15,000 lines
- **Critical Issues**: 15+ bugs and architectural problems
- **Target Reduction**: 60% size reduction (~6,000 lines)

## Phase-by-Phase Breakdown

### PHASE 1: EMERGENCY FIXES (Week 1)
**Priority**: CRITICAL - Fix security issues and memory leaks

#### Tasks:
1. **Fix ProviderManager Singleton Memory Leak**
   - Location: `src/lib/provider-manager.ts`
   - Issue: User-specific data in singleton pattern
   - Impact: Security risk + memory leaks

2. **Remove Unused Files** 
   - Delete: `src/lib/hooks/use-file-upload.ts`
   - Delete: `src/components/file-upload.tsx`
   - Delete: `src/lib/stores/password-store.ts`
   - Delete: `src/components/layout/responsive-layout.tsx`

3. **Fix Authentication Race Conditions**
   - Location: `src/lib/stores/preferences-store.ts`
   - Issue: Global loading state in module scope

4. **Add Error Boundaries**
   - Missing proper error handling in React components

### PHASE 2: STORE CONSOLIDATION (Week 2)
**Priority**: HIGH - Reduce from 9 stores to 3 stores

#### Current Stores (TO CONSOLIDATE):
- `chat-store.ts` (300+ lines)
- `provider-store.ts` (200+ lines)  
- `settings-store.ts` (250+ lines)
- `ui-store.ts` (150+ lines)
- `notification-store.ts` (200+ lines)
- `form-store.ts` (300+ lines) - DELETE ENTIRELY
- `file-upload-store.ts` (200+ lines)
- `preferences-store.ts` (100+ lines)

#### Target: 3 Consolidated Stores
1. **App Store** - Chat, UI, User state
2. **Provider Store** - AI providers and models
3. **Upload Store** - File upload management

### PHASE 3: DATABASE CLEANUP (Week 2-3)
**Priority**: HIGH - Remove redundant tables and queries

#### Issues:
- BetterAuth tables redefined unnecessarily
- 5+ tables that can be merged or deleted
- N+1 query patterns in `getChatWithMessages`

### PHASE 4: PROVIDER SYSTEM REWRITE (Week 3)
**Priority**: HIGH - Simplify from 600 lines to ~100 lines

#### Current Issues:
- Singleton pattern with user state
- Multiple caching layers
- Over-engineered API key management

### PHASE 5: COMPONENT REFACTORING (Week 4)
**Priority**: MEDIUM - Reduce component complexity

#### Issues:
- Props drilling (15+ props in ChatInterface)
- Duplicate dialog components
- Excessive "use client" directives

### PHASE 6: API ROUTE CONSOLIDATION (Week 4)
**Priority**: MEDIUM - Add middleware and reduce duplication

#### Issues:
- 20+ duplicated auth checks
- No error handling middleware
- Copy-pasted CRUD patterns

## Success Metrics
- [ ] Bundle size reduced by 60%
- [ ] Store count reduced from 9 to 3
- [ ] Database tables reduced by 40%
- [ ] Component props reduced by 50%
- [ ] API routes simplified with middleware
- [ ] All memory leaks fixed
- [ ] All security issues resolved

## Dependencies Between Phases
- Phase 1 must complete before Phase 2
- Phase 2 and 3 can run in parallel
- Phase 4 depends on Phase 2 completion
- Phase 5 and 6 can run in parallel after Phase 4

## Estimated Timeline: 3-4 weeks
- Week 1: Phase 1 (Emergency fixes)
- Week 2: Phase 2 + Phase 3 start
- Week 3: Phase 3 + Phase 4
- Week 4: Phase 5 + Phase 6