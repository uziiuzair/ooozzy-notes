# Events System - Quick Reference

Production-grade event system for Notes.Ooozzy with type-safe events, React hooks, and visual debugger.

## Quick Start

### Emit Events

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

### Listen to Events

```tsx
import { useEventListener } from '@/lib/events';

function NotificationPanel() {
  useEventListener('note:created', (data) => {
    showToast(`Note created: ${data.title}`);
  }, []);

  return <div>Notifications</div>;
}
```

### Use from Providers

```tsx
import { useEvents } from '@/hooks/useEvents';

function MyProvider() {
  const { emit } = useEvents();

  const createNote = async () => {
    // ... create note logic
    emit('note:created', { noteId, folderId, title, timestamp: Date.now() });
  };
}
```

## Available Events

### Note Events
- `note:created` - Note created
- `note:updated` - Note updated
- `note:deleted` - Note deleted
- `note:moved` - Note moved to different folder

### Folder Events
- `folder:created` - Folder created
- `folder:updated` - Folder updated
- `folder:deleted` - Folder deleted
- `folder:opened` - Folder opened
- `folder:closed` - Folder closed

### Photo Events
- `photo:uploaded` - Photo uploaded
- `photo:deleted` - Photo deleted
- `photo:moved` - Photo moved to different folder

### Link Events
- `link:captured` - Link captured
- `link:deleted` - Link deleted
- `link:moved` - Link moved to different folder

### Search Events
- `search:performed` - Search performed
- `search:cleared` - Search cleared

### Error Events
- `error:storage_quota` - Storage quota exceeded
- `error:network` - Network error
- `error:client` - Client-side error
- `system:listener_error` - Event listener error

### System Events
- `system:initialized` - System initialized
- `system:offline` - System went offline
- `system:online` - System came online
- `system:visibility_changed` - Page visibility changed

## Hooks API

### useEventEmitter()
Returns a stable emit function that won't cause re-renders.

```tsx
const emit = useEventEmitter();
emit('note:created', { noteId, folderId, title, timestamp });
```

### useEventListener(event, callback, deps)
Subscribe to events with automatic cleanup on unmount.

```tsx
useEventListener('note:created', async (data) => {
  await refreshNotes();
}, [refreshNotes]);
```

### useEventHistory({ limit, autoRefresh })
Access event history for debugging (dev only).

```tsx
const { events, clear, refresh, totalCount } = useEventHistory({ limit: 50 });
```

### useEvents()
Access full event system from context.

```tsx
const { emit, on, off, getMetrics, clearHistory } = useEvents();
```

## Direct EventBus Access

For advanced use cases:

```tsx
import { eventBus } from '@/lib/events';

// Emit
eventBus.emit('note:created', { noteId, folderId, title, timestamp });

// Subscribe
const unsubscribe = eventBus.on('note:created', (data) => {
  console.log('Note created:', data);
});

// Unsubscribe
unsubscribe();

// Wildcard listener (all events)
eventBus.on('*', (event, data) => {
  console.log('Event:', event, data);
});
```

## Visual Debugger

In development mode, open the floating event debugger panel (bottom-right):

- **Minimize/Maximize**: Click header
- **Filter Events**: Type in filter box
- **Copy Event**: Click "Copy" button on any event
- **Clear History**: Click "Clear" button

The debugger shows:
- Real-time event stream
- Event timestamps
- Event data (formatted JSON)
- Total event count badge

## Features

### Production-Ready
- ✅ Type-safe events with autocomplete
- ✅ Circuit breaker (auto-disable failing listeners)
- ✅ Performance monitoring (warns if >10ms)
- ✅ Error isolation (listener errors don't crash app)
- ✅ SSR-safe (client-only operations)
- ✅ Memory-safe (WeakMap references)

### Developer Experience
- ✅ Visual debugger (dev only)
- ✅ Event history with localStorage persistence (dev only)
- ✅ React hooks for easy integration
- ✅ Clean barrel exports
- ✅ Follows project patterns (Atomic Design, Provider pattern)

## Configuration

Located in `src/lib/events/config.ts`:

**Development Mode**:
- Event history enabled
- Performance tracking enabled
- Debug logging enabled
- Visual debugger enabled
- Stores last 100 events in localStorage

**Production Mode**:
- Minimal overhead
- No history, no logging
- Circuit breaker still active
- Error isolation still active

## File Structure

```
src/
├── lib/events/
│   ├── index.ts              # Main export
│   ├── types.ts              # Event types
│   ├── config.ts             # Configuration
│   ├── EventBus.ts           # Core singleton
│   └── hooks/
│       ├── useEventEmitter.ts
│       ├── useEventListener.ts
│       └── useEventHistory.ts
├── providers/
│   └── EventsProvider.tsx    # React Context
├── hooks/
│   └── useEvents.ts          # Convenience hook
└── components/organisms/
    └── EventDebugger.tsx     # Visual debugger
```

## Integration Examples

### NotesProvider Integration

```tsx
import { useEvents } from '@/hooks/useEvents';

export const NotesProvider = ({ children }) => {
  const { emit } = useEvents();
  const [notes, setNotes] = useState([]);

  const createNote = async (note) => {
    const newNote = await storage.createNote(note);
    setNotes([...notes, newNote]);

    // Emit event
    emit('note:created', {
      noteId: newNote.id,
      folderId: newNote.folderId,
      title: newNote.title,
      timestamp: Date.now()
    });
  };

  const updateNote = async (noteId, updates) => {
    await storage.updateNote(noteId, updates);
    setNotes(notes.map(n => n.id === noteId ? { ...n, ...updates } : n));

    // Emit event
    emit('note:updated', {
      noteId,
      folderId: updates.folderId || null,
      fieldsUpdated: Object.keys(updates),
      timestamp: Date.now()
    });
  };

  const deleteNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId);
    await storage.deleteNote(noteId);
    setNotes(notes.filter(n => n.id !== noteId));

    // Emit event
    emit('note:deleted', {
      noteId,
      folderId: note.folderId,
      timestamp: Date.now()
    });
  };

  return (
    <NotesContext.Provider value={{ notes, createNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
};
```

### Cross-Domain Event Listener

```tsx
import { useEventListener } from '@/lib/events';

function AnalyticsTracker() {
  // Track all note events
  useEventListener('note:created', (data) => {
    trackEvent('Note Created', { noteId: data.noteId });
  }, []);

  useEventListener('note:updated', (data) => {
    trackEvent('Note Updated', { noteId: data.noteId });
  }, []);

  useEventListener('note:deleted', (data) => {
    trackEvent('Note Deleted', { noteId: data.noteId });
  }, []);

  // Track search events
  useEventListener('search:performed', (data) => {
    trackEvent('Search Performed', { query: data.query, results: data.resultsCount });
  }, []);

  return null;
}
```

## Next Steps

1. **Emit events from existing providers** (NotesProvider, FoldersProvider, etc.)
2. **Add event listeners** for analytics, notifications, cross-domain features
3. **Implement undo/redo** using event history
4. **Add toast notifications** triggered by events
5. **Set up analytics tracking** with event listeners

---

**Documentation**: See `claude_docs/tasks/001-events-provider.md` for complete implementation details.
