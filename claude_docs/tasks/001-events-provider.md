# Task 001: Events Provider System

**Status**: ✅ Done
**Priority**: High
**Rung**: Foundation (Pre-0.3)
**Created**: 2025-01-30
**Completed**: 2025-01-30

---

## Overview

Implement a production-grade event system for Notes.Ooozzy with type-safe events, React hooks, circuit breaker pattern, performance monitoring, and visual debugger (dev only).

## Purpose

Create a decoupled communication system that allows components and providers to emit and listen to events without tight coupling. This enables cross-domain features, analytics tracking, undo/redo systems, and better separation of concerns.

---

## Acceptance Criteria

- [x] Type-safe event registry with Notes.Ooozzy specific events
- [x] EventBus singleton with emit/on/off methods
- [x] Circuit breaker pattern (auto-disable failing listeners)
- [x] Performance monitoring (warn on slow listeners >10ms)
- [x] Error isolation (listener errors don't crash app)
- [x] SSR-safe (client-only operations)
- [x] Event history (dev only, persisted to localStorage)
- [x] React hooks: useEventEmitter, useEventListener, useEventHistory
- [x] EventsProvider with React Context integration
- [x] EventDebugger component (dev only, floating panel)
- [x] Integrated with AppProvider (outermost provider)
- [x] Barrel exports for clean imports
- [x] TypeScript build passes with no errors
- [x] Follows Atomic Design (EventDebugger as organism)
- [x] Follows provider pattern (Context + custom hooks)
- [x] Performance target: <10ms emit time, <500ms interactions

---

## Implementation Details

### File Structure Created

```
src/
├── lib/
│   └── events/
│       ├── index.ts                    # Main barrel export
│       ├── types.ts                    # Type-safe event registry
│       ├── config.ts                   # Configuration
│       ├── EventBus.ts                 # Core singleton
│       └── hooks/
│           ├── index.ts                # Hooks barrel export
│           ├── useEventEmitter.ts      # Emit events hook
│           ├── useEventListener.ts     # Subscribe to events hook
│           └── useEventHistory.ts      # Debug history hook
├── providers/
│   ├── EventsProvider.tsx              # Events context provider
│   └── AppProvider.tsx                 # Updated to wrap EventsProvider
├── hooks/
│   └── useEvents.ts                    # Convenience hook
└── components/
    └── organisms/
        └── EventDebugger.tsx           # Visual debugger (dev only)
```

### Event Types Implemented

**Note Events**: `note:created`, `note:updated`, `note:deleted`, `note:moved`
**Folder Events**: `folder:created`, `folder:updated`, `folder:deleted`, `folder:opened`, `folder:closed`
**Photo Events**: `photo:uploaded`, `photo:deleted`, `photo:moved`
**Link Events**: `link:captured`, `link:deleted`, `link:moved`
**Search Events**: `search:performed`, `search:cleared`
**Error Events**: `error:storage_quota`, `error:network`, `error:client`, `system:listener_error`
**System Events**: `system:initialized`, `system:offline`, `system:online`, `system:visibility_changed`
**User Events**: `user:action`, `user:navigation`

### Core Features

**EventBus Singleton**:
- Type-safe emit/on/off methods with autocomplete
- Circuit breaker (disables listeners after 5 failures)
- Performance monitoring (warns if >10ms)
- Error isolation (try-catch around all listeners)
- WeakMap for circuit breaker state (memory-safe)
- Event history with localStorage persistence (dev only)

**React Integration**:
- `useEventEmitter()` - Stable callback for emitting events
- `useEventListener(event, callback, deps)` - Auto-cleanup on unmount
- `useEventHistory({ limit, autoRefresh })` - Debug history access
- `useEvents()` - Convenience hook for context access

**EventsProvider**:
- Wraps EventBus in React Context
- Provides emit, on, off, getMetrics, clearHistory
- Integrated as outermost provider in AppProvider

**EventDebugger Component**:
- Floating panel (bottom-right, minimizable)
- Real-time event stream with Framer Motion animations
- Filter by event name/namespace
- Copy event data to clipboard
- Clear history button
- Event count badge with spring animation
- Playful curvy UI (rounded-xl, shadows, transitions)
- Only renders in development mode

### Configuration

**Development Mode**:
- Event history enabled (localStorage: `ooozzy-events-history`)
- Performance tracking enabled
- Debug logging enabled
- Visual debugger enabled
- Stores last 100 events

**Production Mode**:
- Minimal overhead (no history, no logging)
- Circuit breaker still active
- Error isolation still active
- Performance monitoring disabled

---

## Progress Log

**2025-01-30 - Initial Implementation**
- Created event types registry with Notes.Ooozzy specific events
- Implemented EventBus singleton with all core features
- Built configuration system (dev vs production)
- Created React hooks (useEventEmitter, useEventListener, useEventHistory)
- Implemented EventsProvider with React Context
- Integrated EventsProvider into AppProvider (outermost)
- Built EventDebugger component with playful UI
- Added EventDebugger to layout.tsx (dev only)
- Created barrel exports for clean imports
- All files follow TypeScript-first pattern (no `any` types)
- Follows Atomic Design (EventDebugger as organism)
- Follows provider pattern (Context + custom hooks)

**Testing**:
- TypeScript build passes
- No type errors
- SSR-safe (client-only operations)
- Event history persists across page reloads (dev mode)
- Circuit breaker prevents error loops
- Performance monitoring warns about slow listeners

---

## Files Modified/Created

**Created**:
- `src/lib/events/types.ts` - Type-safe event registry
- `src/lib/events/config.ts` - Configuration
- `src/lib/events/EventBus.ts` - Core singleton
- `src/lib/events/hooks/useEventEmitter.ts` - Emit hook
- `src/lib/events/hooks/useEventListener.ts` - Subscribe hook
- `src/lib/events/hooks/useEventHistory.ts` - History hook
- `src/lib/events/hooks/index.ts` - Hooks barrel export
- `src/lib/events/index.ts` - Main barrel export
- `src/providers/EventsProvider.tsx` - Events context provider
- `src/hooks/useEvents.ts` - Convenience hook
- `src/components/organisms/EventDebugger.tsx` - Visual debugger

**Modified**:
- `src/providers/AppProvider.tsx` - Wrapped with EventsProvider
- `src/app/layout.tsx` - Added EventDebugger component (dev only)

---

## Usage Examples

**Emit events**:
```tsx
import { useEventEmitter } from '@/lib/events';

function NoteEditor() {
  const emit = useEventEmitter();

  const handleSave = () => {
    emit('note:created', {
      noteId: note.id,
      folderId: note.folderId,
      title: note.title,
      timestamp: Date.now()
    });
  };

  return <button onClick={handleSave}>Save</button>;
}
```

**Listen to events**:
```tsx
import { useEventListener } from '@/lib/events';

function NotificationPanel() {
  useEventListener('note:created', (data) => {
    showToast(`Note created: ${data.title}`);
  }, []);

  return <div>Notifications</div>;
}
```

**Access from providers**:
```tsx
import { useEvents } from '@/hooks/useEvents';

// In NotesProvider
const { emit } = useEvents();
emit('note:updated', { noteId, folderId, fieldsUpdated: ['title'], timestamp: Date.now() });
```

**Direct EventBus access** (if needed):
```tsx
import { eventBus } from '@/lib/events';

eventBus.emit('note:deleted', { noteId, folderId, timestamp: Date.now() });
```

---

## Next Steps

### Immediate Integration Opportunities
1. **Emit events from existing providers**:
   - NotesProvider: emit `note:created`, `note:updated`, `note:deleted`
   - FoldersProvider: emit `folder:created`, `folder:updated`, `folder:deleted`
   - PhotosProvider: emit `photo:uploaded`, `photo:deleted`
   - LinksProvider: emit `link:captured`, `link:deleted`

2. **Add event listeners for cross-domain features**:
   - Folder updates trigger note refresh
   - Search events for analytics tracking
   - Error events for user-friendly notifications

3. **Future Features**:
   - Analytics listeners (track user actions)
   - Undo/redo system using event history
   - Toast notifications on events
   - Real-time collaboration (when adding multiplayer)

---

## Completion Notes

✅ **All acceptance criteria met**
✅ **TypeScript build passes**
✅ **Follows all project patterns** (Atomic Design, Provider pattern, TypeScript-first)
✅ **Performance optimized** (<10ms emit time, circuit breaker, error isolation)
✅ **Developer experience** (Visual debugger, type-safe hooks, clean API)
✅ **Production ready** (minimal overhead, SSR-safe, memory-safe)

The Events Provider system is complete and ready for integration across the app. It provides a solid foundation for decoupled communication, analytics tracking, and future features like undo/redo.

**Status**: ✅ **DONE**
