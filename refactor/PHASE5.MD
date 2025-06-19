# Phase 5: Component Refactoring - Reduce Complexity & Props Drilling

## Current Component Problems

### Issue 1: Excessive Props Drilling
```typescript
// chat-interface.tsx - 15+ props!
<ChatInterface 
  chatId={id}
  initialMessages={initialMessages}
  chatTitle={chatTitle}
  selectedProvider={selectedProvider}
  selectedModel={selectedModel}
  systemPrompt={systemPrompt}
  enabledTools={enabledTools}
  // ... 8 more props
/>
```

### Issue 2: Duplicate Dialog Components
- `SearchDialog` (150+ lines)
- `ExportDialog` (200+ lines)  
- `ShareDialog` (120+ lines)
- `SettingsDialog` (100+ lines)
- All follow same pattern but are separate components

### Issue 3: Over-use of "use client"
```typescript
// 80% of components have this when they don't need it
"use client";
```

### Issue 4: Complex Component Structure
- Single components with 300+ lines
- Mixed server/client logic
- No clear separation of concerns

---

## PHASE 5A: Create Generic Dialog Component

### Current Problem: 4 Separate Dialog Components

Each dialog has similar structure:
- Modal overlay
- Close button
- Header with title
- Content area  
- Footer with actions

### Instructions for Claude:

**Context**: Instead of 4 separate dialog components totaling 600+ lines, create one reusable Dialog component that handles all dialogs.

**Task**: Create `src/components/ui/modal-dialog.tsx`:

```typescript
interface ModalDialogProps {
  type: 'search' | 'export' | 'share' | 'settings';
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data?: any; // Type-safe based on dialog type
}

export function ModalDialog({ type, isOpen, onClose, title, data }: ModalDialogProps) {
  // Single dialog component that renders different content based on type
  // Use dynamic imports for content components
  // Handle common functionality (overlay, close, animations)
}
```

#### Content Components (Simplified):
```typescript
// src/components/dialogs/search-content.tsx (50 lines instead of 150)
// src/components/dialogs/export-content.tsx (60 lines instead of 200)  
// src/components/dialogs/share-content.tsx (40 lines instead of 120)
// src/components/dialogs/settings-content.tsx (80 lines instead of 100)
```

**Requirements**:
1. **Single dialog shell** - handles overlay, animations, close
2. **Dynamic content loading** - import content based on type
3. **Type-safe props** - different data types for different dialogs
4. **Reduce total lines** from 600+ to ~300
5. **Common functionality** - keyboard handling, focus management

---

## PHASE 5B: Eliminate Props Drilling with Context

### Current Problem: ChatInterface Props Explosion

```typescript
// chat-interface.tsx - Too many props!
interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: any[];
  chatTitle?: string;
  selectedProvider: ProviderType;
  selectedModel: string;
  systemPrompt: string;
  enabledTools: ToolName[];
  onProviderChange: (provider: ProviderType, model: string) => void;
  onToolsChange: (tools: ToolName[]) => void;
  // ... more props
}
```

### Instructions for Claude:

**Context**: Chat components need shared state but passing 15+ props through multiple levels is unmaintainable. Use React Context for shared chat state.

**Task**: Create chat context system:

#### 1. Create Chat Context:
```typescript
// src/context/chat-context.tsx
interface ChatContextValue {
  // Chat state
  chatId: string | null;
  messages: Message[];
  isLoading: boolean;
  
  // Provider state  
  selectedProvider: ProviderType;
  selectedModel: string;
  
  // Actions
  sendMessage: (content: string) => void;
  setProvider: (provider: ProviderType, model: string) => void;
  setSystemPrompt: (prompt: string) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);
export const useChatContext = () => { /* hook implementation */ };
```

#### 2. Wrap ChatInterface:
```typescript
// Simplified ChatInterface with no props drilling
export function ChatInterface({ chatId }: { chatId?: string }) {
  return (
    <ChatProvider chatId={chatId}>
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </ChatProvider>
  );
}
```

#### 3. Update Child Components:
```typescript
// Each child component uses context instead of props
function ChatHeader() {
  const { selectedProvider, selectedModel, setProvider } = useChatContext();
  // No props needed!
}
```

**Requirements**:
1. **Reduce ChatInterface props** from 15+ to 1-2
2. **Use context for shared state** - provider, model, tools
3. **Keep performance** - proper memoization
4. **Type safety** - strict TypeScript context types

---

## PHASE 5C: Fix Server/Client Component Usage

### Current Problem: Excessive "use client"

**Bad examples**:
```typescript
// These should be server components:
"use client";
export default function DashboardPage() { /* static content */ }

"use client"; 
export default function SettingsPage() { /* mostly static */ }

"use client";
export function MessageRenderer() { /* could be server-rendered */ }
```

### Instructions for Claude:

**Context**: This is a Next.js 14 app with app directory. You should minimize client components and maximize server components for performance.

**Task**: Audit and fix client/server component usage:

#### Server Components (Remove "use client"):
1. **Static pages** - Dashboard, Settings, Chat pages
2. **Layout components** - Headers, navigation
3. **Message rendering** - Most of MessageRenderer
4. **Static content** - About, help pages

#### Client Components (Keep "use client"):
1. **Interactive UI** - Form inputs, buttons with state
2. **Real-time features** - Chat input, streaming messages  
3. **Store integration** - Components using Zustand
4. **Browser APIs** - File upload, clipboard

#### Hybrid Approach for Complex Components:
```typescript
// chat-interface.tsx (server component)
export function ChatInterface({ chatId }: { chatId: string }) {
  // Server-side data fetching
  const initialData = await getChatWithMessages(chatId);
  
  return (
    <div>
      <ChatHeader title={initialData.title} /> {/* Server component */}
      <MessageList messages={initialData.messages} /> {/* Server component */}
      <ChatInputClient /> {/* Client component for interactivity */}
    </div>
  );
}
```

**Requirements**:
1. **Audit all "use client"** directives - remove unnecessary ones
2. **Split components** when needed (server + client parts)
3. **Test performance** - ensure no hydration issues
4. **Maintain functionality** - all features still work

---

## PHASE 5D: Simplify Complex Components

### Current Problem: Monolithic Components

**Examples of bloated components**:
- `ChatInterface` (300+ lines) - Too many responsibilities
- `ProviderSettings` (400+ lines) - Massive form component
- `MessageRenderer` (200+ lines) - Handles too many message types

### Instructions for Claude:

**Context**: Large components are hard to maintain and test. Break them into focused, single-responsibility components.

**Task**: Break down large components:

#### 1. Split ChatInterface:
```typescript
// Before: 300-line monolith
// After: Focused components

// chat-interface.tsx (50 lines)
export function ChatInterface({ chatId }: ChatInterfaceProps) {
  return (
    <ChatProvider chatId={chatId}>
      <ChatLayout>
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </ChatLayout>
    </ChatProvider>
  );
}

// chat-header.tsx (40 lines)
// chat-messages.tsx (60 lines)  
// chat-input.tsx (80 lines)
// chat-layout.tsx (30 lines)
```

#### 2. Split ProviderSettings:
```typescript
// Before: 400-line form monster
// After: Focused provider components

// provider-settings.tsx (60 lines) - Main container
// provider-card.tsx (80 lines) - Individual provider
// api-key-form.tsx (50 lines) - Key management
// model-selector.tsx (40 lines) - Model selection
```

#### 3. Split MessageRenderer:
```typescript
// Before: 200-line component handling all message types  
// After: Specialized renderers

// message-renderer.tsx (40 lines) - Router component
// text-message.tsx (30 lines)
// code-message.tsx (40 lines)
// tool-message.tsx (35 lines)
// attachment-message.tsx (45 lines)
```

**Requirements**:
1. **Single responsibility** - each component does one thing
2. **Focused interfaces** - clear, minimal props
3. **Reusable** - components can be used elsewhere
4. **Testable** - easy to unit test individual pieces
5. **Total reduction** - 50% fewer lines per component file

---

## PHASE 5E: Create Reusable UI Components

### Current Problem: Inline Styles and Repeated Patterns

**Examples of repeated UI patterns**:
- Loading states (copy-pasted everywhere)
- Error displays (inconsistent styling)
- Form inputs (no standardization)
- Buttons (multiple variants scattered)

### Instructions for Claude:

**Context**: Create a consistent design system with reusable components to reduce duplication and improve consistency.

**Task**: Create reusable UI component library:

#### 1. Loading Components:
```typescript
// src/components/ui/loading.tsx
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {}
export function LoadingOverlay({ children }: { children: React.ReactNode }) {}
export function SkeletonLoader({ lines = 3 }: { lines?: number }) {}
```

#### 2. Error Components:
```typescript
// src/components/ui/error.tsx  
export function ErrorBoundary({ children }: { children: React.ReactNode }) {}
export function ErrorMessage({ error }: { error: string }) {}
export function RetryButton({ onRetry }: { onRetry: () => void }) {}
```

#### 3. Form Components:
```typescript
// src/components/ui/form.tsx
export function FormField({ label, error, children }: FormFieldProps) {}
export function FormSection({ title, children }: FormSectionProps) {}
export function FormActions({ children }: FormActionsProps) {}
```

#### 4. Replace Inline Usage:
```typescript
// Before: Inline loading in every component
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

// After: Consistent component
<LoadingSpinner size="md" />
```

**Requirements**:
1. **Consistent styling** - use design tokens
2. **Accessibility** - proper ARIA labels, keyboard navigation
3. **TypeScript** - strict prop types
4. **Documentation** - clear usage examples
5. **Performance** - lightweight, no unnecessary renders

---

## PHASE 5F: Optimize Component Performance

### Current Problem: Unnecessary Re-renders

**Performance issues found**:
- Components re-rendering on every store change
- Large lists without virtualization
- Expensive computations on every render
- No memoization for complex operations

### Instructions for Claude:

**Context**: Some components are causing performance issues due to excessive re-renders and lack of optimization.

**Task**: Add performance optimizations:

#### 1. Memoize Expensive Components:
```typescript
// Large message lists
export const MessageList = memo(function MessageList({ messages }: MessageListProps) {
  // Virtualize long message lists
  // Memoize message renderers
});

// Complex provider selectors
export const ProviderSelector = memo(function ProviderSelector(props: ProviderSelectorProps) {
  // Memoize model calculations
  // Prevent re-renders on unrelated state changes
});
```

#### 2. Add Virtual Scrolling:
```typescript
// For chat messages and long lists
import { FixedSizeList as List } from 'react-window';

export function VirtualizedMessageList({ messages }: { messages: Message[] }) {
  // Render only visible messages
  // Handle dynamic message heights
}
```

#### 3. Optimize Store Selectors:
```typescript
// Instead of subscribing to entire store
const { allStoreData } = useAppStore(); // BAD - causes many re-renders

// Subscribe to specific data only  
const messages = useAppStore(state => state.messages); // GOOD - targeted updates
```

**Requirements**:
1. **Identify re-render causes** - use React DevTools Profiler
2. **Add strategic memoization** - don't over-optimize
3. **Virtualize long lists** - messages, chat lists, file lists
4. **Optimize store subscriptions** - targeted selectors only
5. **Measure improvements** - before/after performance metrics

---

## MIGRATION STRATEGY

### Week 4, Day 1-2: Create New Infrastructure
1. Create generic ModalDialog component
2. Create chat context system
3. Create reusable UI components
4. Test new components in isolation

### Week 4, Day 3: Update Major Components  
1. Refactor ChatInterface to use context (remove props drilling)
2. Update dialog usage to use generic ModalDialog
3. Split large components into focused pieces
4. Test component functionality

### Week 4, Day 4: Server/Client Optimization
1. Audit all "use client" usage
2. Convert appropriate components to server components
3. Split hybrid components (server + client parts)
4. Test performance and hydration

### Week 4, Day 5: Performance & Polish
1. Add memoization where needed
2. Implement virtual scrolling for long lists
3. Optimize store subscriptions
4. Final testing and performance measurement

---

## VERIFICATION CHECKLIST

### Code Reduction:
- [ ] Dialog components reduced from 600+ to ~300 lines
- [ ] ChatInterface props reduced from 15+ to 1-2
- [ ] Large components split into focused pieces
- [ ] "use client" usage reduced by 70%

### Performance:
- [ ] Chat interface renders smoothly with 1000+ messages
- [ ] No unnecessary re-renders in performance profiler
- [ ] Fast navigation between chats
- [ ] Responsive UI interactions

### Code Quality:
- [ ] Clear component boundaries and responsibilities
- [ ] Consistent UI patterns across app
- [ ] Proper TypeScript types throughout
- [ ] Good accessibility (ARIA labels, keyboard nav)

### Functionality:
- [ ] All dialogs work correctly
- [ ] Chat functionality unchanged
- [ ] Provider selection works
- [ ] File uploads work
- [ ] All user interactions responsive

## Expected Outcomes

### Before:
- 15+ props drilling through components
- 600+ lines of duplicate dialog code
- "use client" on 80% of components
- Large monolithic components (300+ lines each)
- Performance issues with large message lists

### After:
- Context-based state sharing (no props drilling)
- Single reusable dialog component (~300 lines total)
- "use client" only where needed (~20% of components)
- Focused components (50-100 lines each)
- Smooth performance with virtualization

**Bundle Size**: 30% reduction in component code
**Performance**: 3x faster rendering for large chats
**Maintainability**: 80% easier to modify individual features
**Developer Experience**: Much clearer component structure