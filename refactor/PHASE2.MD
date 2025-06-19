# Phase 2: Store Consolidation - Reduce 9 Stores to 3

## Current State: 9 Zustand Stores (CHAOS!)

### Existing Stores to Consolidate:
1. `chat-store.ts` (300+ lines) - Chat state, provider selection
2. `provider-store.ts` (200+ lines) - Provider configurations  
3. `settings-store.ts` (250+ lines) - User preferences
4. `ui-store.ts` (150+ lines) - Dialog states, sidebar
5. `notification-store.ts` (200+ lines) - Toast notifications
6. `form-store.ts` (300+ lines) - **DELETE ENTIRELY** (overkill)
7. `file-upload-store.ts` (200+ lines) - File upload progress
8. `preferences-store.ts` (100+ lines) - Overlaps with settings
9. `password-store.ts` (80+ lines) - **ALREADY DELETED** in Phase 1

## Target: 3 Consolidated Stores

### NEW STORE 1: App Store (`src/lib/stores/app-store.ts`)

**Purpose**: Core application state (chat, UI, user)

**Consolidates**: 
- `chat-store.ts` (chat state)
- `ui-store.ts` (UI state) 
- `settings-store.ts` (user preferences)
- `preferences-store.ts` (merge into settings)

### NEW STORE 2: Provider Store (`src/lib/stores/provider-store.ts`)

**Purpose**: AI provider management (simplified)

**Consolidates**:
- Existing `provider-store.ts` (simplified)
- Provider-related parts of `settings-store.ts`

### NEW STORE 3: Upload Store (`src/lib/stores/upload-store.ts`)

**Purpose**: File upload progress and notifications

**Consolidates**:
- `file-upload-store.ts` 
- Upload-related notifications from `notification-store.ts`

---

## DETAILED CONSOLIDATION INSTRUCTIONS

## Store 1: App Store

### Instructions for Claude:

**Context**: This will be the main application store handling chat state, UI state, and user preferences. It needs to be performant and well-structured.

**Task**: Create `src/lib/stores/app-store.ts` by merging:

#### From `chat-store.ts` - Take these:
```typescript
// Chat state
selectedProvider: ProviderType;
selectedModel: string;
systemPrompt: string;
enabledTools: ToolName[];
currentChatId: string | null;
isGenerating: boolean;

// Actions  
setProvider: (provider: ProviderType) => void;
setModel: (model: string) => void;
setSystemPrompt: (prompt: string) => void;
setEnabledTools: (tools: ToolName[]) => void;
setCurrentChatId: (chatId: string | null) => void;
setIsGenerating: (generating: boolean) => void;
```

#### From `ui-store.ts` - Take these:
```typescript
// UI state
searchDialogOpen: boolean;
exportDialogOpen: boolean;
shareDialogOpen: boolean;
settingsDialogOpen: boolean;
showSidebar: boolean;

// Actions
openSearchDialog: () => void;
closeSearchDialog: () => void;
openExportDialog: () => void;
closeExportDialog: () => void;
openShareDialog: () => void;
closeShareDialog: () => void;
toggleSidebar: () => void;
```

#### From `settings-store.ts` + `preferences-store.ts` - Take these:
```typescript
// User preferences
theme: string | null;
language: string | null;
chatSettings: ChatSettings;
uiSettings: UISettings;
notificationSettings: NotificationSettings;

// Actions
updatePreference: (key: string, value: any) => void;
updateChatSetting: (key: keyof ChatSettings, value: any) => void;
updateUISetting: (key: keyof UISettings, value: any) => void;
savePreferences: () => Promise<void>;
```

**Requirements**:
1. Use immer middleware for clean state updates
2. Use persist middleware for UI preferences only (not temporary state)
3. Separate concerns with clear sections in the store
4. Add proper TypeScript types
5. Include proper error handling for async actions

---

## Store 2: Provider Store (Simplified)

### Instructions for Claude:

**Context**: Current provider store is over-engineered. We need a simplified version that just manages provider configurations without the complex caching.

**Task**: Rewrite `src/lib/stores/provider-store.ts` with these changes:

#### REMOVE these complex features:
- Singleton pattern integration
- Complex caching logic
- Custom model management (move to separate component)
- Validation logic (move to server)

#### KEEP these essential features:
```typescript
interface ProviderState {
  // Simple provider configs
  providers: Record<ProviderType, ProviderConfig>;
  
  // Loading states
  isLoading: boolean;
  
  // Actions (simplified)
  loadProviders: () => Promise<void>;
  saveApiKey: (provider: ProviderType, apiKey: string) => Promise<void>;
  deleteApiKey: (provider: ProviderType) => Promise<void>;
  
  // Getters
  getAvailableProviders: () => ProviderType[];
  getAvailableModels: (provider: ProviderType) => ModelConfig[];
}
```

**Requirements**:
1. Remove all singleton integration
2. Simplify from 400+ lines to ~150 lines
3. Make all operations stateless (fetch from server)
4. Use React Query patterns for server state
5. Remove complex custom model management

---

## Store 3: Upload Store

### Instructions for Claude:

**Context**: File uploads need progress tracking and error handling, but current implementation is over-engineered.

**Task**: Create `src/lib/stores/upload-store.ts` by simplifying `file-upload-store.ts`:

#### Essential features only:
```typescript
interface UploadState {
  // Active uploads
  uploads: Record<string, Upload>;
  
  // Notifications for uploads
  notifications: UploadNotification[];
  
  // Actions
  startUpload: (file: File, chatId: string) => string;
  updateProgress: (uploadId: string, progress: number) => void;
  completeUpload: (uploadId: string, result: FileResult) => void;
  failUpload: (uploadId: string, error: string) => void;
  removeUpload: (uploadId: string) => void;
  
  // Notification actions
  addNotification: (notification: UploadNotification) => void;
  removeNotification: (id: string) => void;
}
```

**Requirements**:
1. Combine upload progress + notifications
2. Simplify from 300+ lines to ~150 lines
3. Remove bulk operations (not needed)
4. Focus on single file upload tracking
5. Auto-cleanup completed uploads after 30 seconds

---

## COMPLETE DELETION INSTRUCTIONS

### Delete Entirely - Form Store

**File**: `src/lib/stores/form-store.ts`

**Why**: 300 lines for basic form validation is massive overkill. Next.js has built-in form handling and libraries like react-hook-form are much better.

### Instructions for Claude:

**Task**: 
1. Delete `src/lib/stores/form-store.ts` completely
2. Find all imports of `useForm` from this store
3. Replace with either:
   - Native React form handling for simple forms
   - `react-hook-form` for complex forms (add dependency)
4. Update all form components to use new pattern

**Pattern replacement example**:
```typescript
// Old (delete this):
const { form, handleSubmit } = useForm('settings-form');

// New (replace with):
const { register, handleSubmit } = useReactHookForm();
```

---

## NOTIFICATION CONSOLIDATION

### Current Problem: 
`notification-store.ts` has 200+ lines for toast notifications. Most functions are unused.

### Instructions for Claude:

**Task**: Simplify notifications by:

1. **Keep in Upload Store**: Upload-related notifications
2. **Global Notifications**: Create simple `src/lib/toast.ts` utility:
   ```typescript
   export const toast = {
     success: (message: string) => { /* simple implementation */ },
     error: (message: string) => { /* simple implementation */ },
     info: (message: string) => { /* simple implementation */ }
   };
   ```
3. **Delete**: Complex notification store features like promise handling, form helpers, etc.

**Requirements**:
- Replace 200-line store with 50-line utility
- Use native browser notifications or simple toast library
- Remove unused notification features

---

## MIGRATION PLAN

### Step 1: Create New Stores
1. Create `app-store.ts` with consolidated state
2. Create simplified `provider-store.ts` 
3. Create simplified `upload-store.ts`

### Step 2: Update Components
1. Update all components importing old stores
2. Replace hooks with new consolidated hooks
3. Test each component after migration

### Step 3: Delete Old Files
1. Delete `chat-store.ts`
2. Delete `ui-store.ts` 
3. Delete `settings-store.ts`
4. Delete `preferences-store.ts`
5. Delete `form-store.ts`
6. Delete `notification-store.ts`
7. Delete `file-upload-store.ts`

### Step 4: Update Imports
1. Search and replace all imports across codebase
2. Update any TypeScript references
3. Fix any broken components

---

## VERIFICATION CHECKLIST

After consolidation:

- [ ] Only 3 store files exist
- [ ] App store handles chat + UI + preferences
- [ ] Provider store is simplified (no singleton)
- [ ] Upload store combines uploads + notifications
- [ ] Form store is completely deleted
- [ ] All components import new stores correctly
- [ ] No broken TypeScript references
- [ ] Bundle size reduced significantly
- [ ] Performance is same or better
- [ ] All functionality still works

## Performance Expectations

### Before:
- 9 stores = 9 separate bundles
- Complex interdependencies
- Multiple re-renders
- Memory overhead from unused features

### After:
- 3 optimized stores
- Clear separation of concerns
- Reduced re-renders
- 60% less code to maintain

**Expected bundle size reduction**: 40-50% for store-related code