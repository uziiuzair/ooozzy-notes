# System Patterns

**Purpose**: Code patterns, conventions, and best practices for Notes.Ooozzy

## Architecture Patterns

### Component Organization (Atomic Design)

**Hierarchy**:
```
atoms/       → Basic UI elements (no composition)
molecules/   → Simple compositions (2-5 atoms)
organisms/   → Complex compositions (molecules + atoms)
templates/   → Page layouts (organisms + molecules + atoms)
```

**Examples by Level**:

**Atoms** (`src/components/atoms/`):
- `Button.tsx` - Interactive button with variants
- `Input.tsx` - Form input fields
- `Typography.tsx` - Text display with variants (h1-h4, body, caption)
- `Badge.tsx` - Small labels for tags and status
- `Card.tsx` - Container with curvy styling

**Molecules** (`src/components/molecules/`):
- `SearchBar.tsx` - Input + icon composition
- `NoteCard.tsx` - Card + Typography + Badge composition
- `FolderCard.tsx` - Card + Typography + drop zone
- `PhotoCard.tsx` - Card + image + caption
- `LinkCard.tsx` - Card + metadata display
- `EmptyState.tsx` - Typography + icon for empty views
- `ContextMenu.tsx` - Menu with items for right-click

**Organisms** (`src/components/organisms/`):
- `NotesGrid.tsx` - Grid of NoteCard components
- `PhotosGrid.tsx` - Masonry grid of PhotoCard components
- `ContentGrid.tsx` - Unified grid (notes + photos + links)
- `FolderBookshelf.tsx` - Grid of FolderCard components

**Templates** (`src/components/templates/`):
- `DashboardTemplate.tsx` - Full dashboard layout with header, grids, and navigation

### Server vs Client Components

**Default: Client Component** (for MVP with LocalStorage)
```typescript
// src/components/organisms/NotesGrid.tsx
"use client";  // Required for hooks, state, events

import { FC } from "react";
import { useNotes } from "@/hooks/useNotes";

export const NotesGrid: FC = () => {
  const { notes } = useNotes();
  // ...
};
```

**Use "use client" When Needed**:
```typescript
// Required for:
// - useState, useEffect, other React hooks
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (localStorage, window, etc.)
// - Third-party libraries (TipTap, Framer Motion)
```

**Decision Tree**:
- ✅ **Client Component**: Interactive UI, state, effects, browser APIs
- ✅ **Server Component**: Static content, data fetching (future with Supabase SSR)

### Data Flow Pattern

**Provider → Custom Hook → Component**:
```typescript
// 1. Provider manages state (src/providers/NotesProvider.tsx)
export const NotesProvider: FC<ProvidersProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const createNote = async (input: NoteInput) => {
    const newNote = await storage.createNote(input);
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  return (
    <NotesContext.Provider value={{ notes, loading, createNote, ... }}>
      {children}
    </NotesContext.Provider>
  );
};

// 2. Custom hook accesses context (src/hooks/useNotes.ts)
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within NotesProvider");
  }
  return context;
};

// 3. Component uses hook (src/components/templates/DashboardTemplate.tsx)
export const DashboardTemplate: FC = () => {
  const { notes, createNote } = useNotes();

  const handleCreateNote = async () => {
    await createNote({ title: "New Note", content: "" });
  };

  return <button onClick={handleCreateNote}>New Note</button>;
};
```

**Key Patterns**:
- Providers wrap entire app in `src/app/layout.tsx`
- Custom hooks enforce provider usage (throw error if missing)
- Components never access context directly
- Storage operations always go through providers

### Storage Adapter Pattern

**Location**: `src/lib/storage/`

**Structure**:
```typescript
// src/lib/storage/types.ts
export interface StorageAdapter {
  getNotes(): Promise<Note[]>;
  createNote(input: NoteInput): Promise<Note>;
  updateNote(id: string, updates: NoteUpdate): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  // ... more methods for folders, photos, links
}

// src/lib/storage/localStorageAdapter.ts
export class LocalStorageAdapter implements StorageAdapter {
  private readonly NOTES_KEY = "ooozzy_notes";

  async getNotes(): Promise<Note[]> {
    try {
      const stored = localStorage.getItem(this.NOTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get notes:", error);
      return [];
    }
  }

  async createNote(input: NoteInput): Promise<Note> {
    const notes = await this.getNotes();
    const newNote: Note = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.push(newNote);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    return newNote;
  }

  // ... more methods
}

// src/lib/storage/index.ts
const storage = new LocalStorageAdapter();
// Future: const storage = new SupabaseAdapter();
export default storage;
```

**Key Patterns**:
- Interface defines contract (future-proof for Supabase)
- All storage operations are async (even localStorage)
- UUID generation for IDs (`crypto.randomUUID()`)
- ISO 8601 timestamps (`new Date().toISOString()`)
- Error handling with try-catch
- Consistent error logging

### Component Props Pattern

**Consistent Prop Names**:
```typescript
interface NoteCardProps {
  // Data
  note: Note;              // Primary entity
  folders?: Folder[];      // Related entities (optional)

  // Handlers (always optional, prefixed with "on")
  onClick?: () => void;
  onDelete?: () => void;
  onUpdate?: (note: Note) => void;
  onDragStart?: (note: Note) => void;
  onDragEnd?: () => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;

  // UI state
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "compact";

  // Style overrides
  className?: string;
}
```

**Key Patterns**:
- Primary entity first (e.g., `note`, `folder`, `photo`)
- Event handlers prefixed with `on` (onClick, onDelete, etc.)
- Boolean props for state (loading, disabled, isPinned)
- Optional className for style overrides
- Default values in destructuring

### Drag-Drop Pattern

**Implementation**:
```typescript
// 1. Component emits drag events
const handleDragStart = (e: React.DragEvent) => {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("application/json", JSON.stringify(note));
  onDragStart?.(note);  // Notify parent of drag start
};

const handleDragEnd = () => {
  onDragEnd?.();  // Notify parent of drag end
};

// 2. Parent tracks dragged item
const [draggedNote, setDraggedNote] = useState<Note | null>(null);

const handleNoteDragStart = (note: Note) => {
  setDraggedNote(note);
};

const handleDragEnd = () => {
  setDraggedNote(null);
};

// 3. Drop target handles drop
const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
  e.preventDefault();
  if (draggedNote) {
    await updateNote(draggedNote.id, { folderId });
    setDraggedNote(null);
  }
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();  // Required to allow drop
  e.dataTransfer.dropEffect = "move";
};
```

## Code Conventions

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `NoteCard.tsx`, `DashboardTemplate.tsx`)
- Hooks: `camelCase.ts` (e.g., `useNotes.ts`, `useFolders.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`, `storage.ts`)
- Types: `camelCase.ts` (e.g., `note.ts`, `folder.ts`)

**Variables**:
- Constants: `UPPER_SNAKE_CASE` (e.g., `NOTES_KEY`, `MAX_FILE_SIZE`)
- Functions: `camelCase` (e.g., `createNote`, `handleDelete`)
- Components: `PascalCase` (e.g., `NoteCard`, `Button`)
- Props interfaces: `PascalCaseProps` (e.g., `ButtonProps`, `NoteCardProps`)

**Functions**:
- Event handlers: `handleEventName` (e.g., `handleClick`, `handleDragStart`)
- Async operations: `operationName` (e.g., `createNote`, `uploadPhoto`)
- Utilities: `verbNoun` (e.g., `formatDate`, `truncateText`, `stripHtml`)

### Import Organization

**Order**:
```typescript
// 1. React and Next.js
import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { motion } from "framer-motion";

// 3. Components (atoms → molecules → organisms → templates)
import { Button } from "@/components/atoms/Button";
import { NoteCard } from "@/components/molecules/NoteCard";
import { NotesGrid } from "@/components/organisms/NotesGrid";

// 4. Hooks and providers
import { useNotes } from "@/hooks/useNotes";

// 5. Types
import { Note, NoteInput } from "@/types/note";

// 6. Utils and lib
import { cn, formatDate } from "@/lib/utils";
import storage from "@/lib/storage";
```

### Component Structure

**Order of Elements**:
```typescript
"use client";  // If needed

// 1. Imports (see above)
import { FC } from "react";

// 2. Interface/Type definitions
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

// 3. Component definition
export const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  // 4. Hooks (useState, useEffect, custom hooks)
  const [isOpen, setIsOpen] = useState(false);
  const { notes } = useNotes();

  // 5. Event handlers
  const handleClick = () => {
    onClick?.();
    setIsOpen(true);
  };

  // 6. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 7. Render helpers (optional)
  const renderContent = () => {
    return <div>{title}</div>;
  };

  // 8. Return JSX
  return (
    <div onClick={handleClick}>
      {renderContent()}
    </div>
  );
};
```

### Error Handling

**Storage Operations**:
```typescript
async createNote(input: NoteInput): Promise<Note> {
  try {
    const notes = await this.getNotes();
    const newNote: Note = { ...input, id: crypto.randomUUID(), ... };
    notes.push(newNote);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    return newNote;
  } catch (error) {
    console.error("Failed to create note:", error);
    throw error;  // Re-throw for caller to handle
  }
}
```

**User-Facing Operations**:
```typescript
const handlePhotoUpload = async (file: File) => {
  try {
    await uploadPhoto(file);
    // Success - no alert needed (photos appear in grid)
  } catch (error: any) {
    // User-friendly error message
    alert(`Failed to upload photo: ${error.message}\n\nTip: Try using a smaller image.`);
    console.error("Upload failed:", error);
  }
};
```

**Key Patterns**:
- Try-catch for all async operations
- Log errors with `console.error` (structured logging in future)
- User-friendly messages for UI errors
- Specific error messages (not generic "Something went wrong")

## LocalStorage Patterns

### CRUD Operations

**Read Collection**:
```typescript
async getNotes(): Promise<Note[]> {
  try {
    const stored = localStorage.getItem(this.NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get notes from localStorage:", error);
    return [];  // Graceful degradation
  }
}
```

**Read Single Item**:
```typescript
async getNote(id: string): Promise<Note | null> {
  const notes = await this.getNotes();
  return notes.find((note) => note.id === id) || null;
}
```

**Create Item**:
```typescript
async createNote(noteInput: NoteInput): Promise<Note> {
  const notes = await this.getNotes();
  const newNote: Note = {
    ...noteInput,
    id: this.generateId(),
    createdAt: this.getCurrentTimestamp(),
    updatedAt: this.getCurrentTimestamp(),
  };
  notes.push(newNote);
  localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  return newNote;
}
```

**Update Item**:
```typescript
async updateNote(id: string, updates: NoteUpdate): Promise<Note> {
  const notes = await this.getNotes();
  const noteIndex = notes.findIndex((note) => note.id === id);

  if (noteIndex === -1) {
    throw new Error(`Note with id ${id} not found`);
  }

  const updatedNote: Note = {
    ...notes[noteIndex],
    ...updates,
    updatedAt: this.getCurrentTimestamp(),
  };

  notes[noteIndex] = updatedNote;
  localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  return updatedNote;
}
```

**Delete Item**:
```typescript
async deleteNote(id: string): Promise<void> {
  const notes = await this.getNotes();
  const filteredNotes = notes.filter((note) => note.id !== id);
  localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
}
```

### Quota Management

**Check Storage Usage**:
```typescript
const getStorageUsage = (): { used: number; total: number } => {
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  // Approximate total (varies by browser)
  const total = 5 * 1024 * 1024;  // 5MB estimate
  return { used, total };
};
```

**Handle Quota Exceeded**:
```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    throw new Error('Storage quota exceeded. Please delete some photos or notes.');
  }
  throw error;
}
```

## UI Patterns

### TailwindCSS Conventions

**Spacing**: Consistent spacing scale
```typescript
// Padding/Margin
p-2, p-4, p-6, p-8      // 0.5rem, 1rem, 1.5rem, 2rem
px-4, py-2              // Horizontal/vertical

// Gap (for flex/grid)
gap-2, gap-4, gap-6     // 0.5rem, 1rem, 1.5rem
```

**Colors**: Custom playful palette
```typescript
// Primary colors
bg-electric-violet-500
text-heliotrope-600
border-french-rose-300

// Semantic colors
bg-white, bg-black
text-gray-600, text-gray-800
border-gray-200, border-gray-300

// State colors
bg-red-500 (danger)
bg-yellow-400 (warning)
bg-green-500 (success)
```

**Layout**: Flexbox and Grid
```typescript
// Flexbox
flex items-center justify-between
flex-col gap-4

// Grid
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

**Responsive**: Mobile-first
```typescript
// Mobile: default (no prefix)
className="px-4 text-sm"

// Tablet: sm (640px+)
className="px-4 sm:px-6 text-sm sm:text-base"

// Desktop: lg (1024px+)
className="px-4 sm:px-6 lg:px-8 text-sm sm:text-base lg:text-lg"
```

**Curvy Aesthetic**: Rounded corners
```typescript
// Default border radius
rounded-2xl         // Components, cards (most common)
rounded-xl          // Smaller elements
rounded-full        // Circular (buttons, badges)
```

**Shadows**: Subtle elevation
```typescript
shadow              // Default soft shadow
shadow-sm           // Lighter shadow
shadow-md           // Medium shadow
shadow-primary      // Purple glow (accent)
```

### cn() Utility for Class Merging

**Pattern**:
```typescript
import { cn } from "@/lib/utils";

// Merge classes with conditional logic
<div className={cn(
  "base-class",
  variant === "primary" && "variant-class",
  disabled && "opacity-50",
  className  // Allow override from props
)} />

// Example from Button.tsx
<button className={cn(
  "rounded-2xl font-medium transition-all",
  "focus:ring-2 focus:ring-offset-2",
  variants[variant],
  sizes[size],
  className
)} />
```

**Key Patterns**:
- Base classes first
- Variants and modifiers
- Conditional classes (use &&)
- Props className last (allows override)

### Animation Pattern (Framer Motion)

**Subtle Transitions**:
```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {content}
</motion.div>
```

**Key Patterns**:
- Short durations (0.15-0.3s)
- Ease-out easing for natural feel
- Subtle movement (10-20px)
- Use sparingly (only for intentional delight)

## Type Definition Pattern

**Location**: `src/types/`

**Structure**:
```typescript
// src/types/note.ts
export interface Note {
  id: string;
  folderId?: string;
  title: string;
  content: string;
  contentType: "markdown" | "richtext";
  tags: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input type (for creation)
export type NoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;

// Update type (for updates - all optional except id)
export type NoteUpdate = Partial<Omit<Note, "id" | "createdAt">>;
```

**Key Patterns**:
- Main interface defines full entity
- Input type omits auto-generated fields (id, timestamps)
- Update type makes all fields optional (Partial)
- Use `?` for truly optional fields (folderId, isPinned)
- Use string for dates (ISO 8601) instead of Date objects

## Performance Patterns

### Debouncing

**Search Input**:
```typescript
import { useState, useEffect } from "react";

const [searchQuery, setSearchQuery] = useState("");
const [debouncedQuery, setDebouncedQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);  // 300ms debounce

  return () => clearTimeout(timer);
}, [searchQuery]);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

**Autosave**:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    saveNote(note);
  }, 500);  // 500ms debounce

  return () => clearTimeout(timer);
}, [note.content]);
```

### Optimistic UI Updates

**Pattern**:
```typescript
const createNote = async (input: NoteInput) => {
  // 1. Optimistically update UI
  const tempNote: Note = {
    ...input,
    id: "temp-" + Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setNotes((prev) => [tempNote, ...prev]);

  try {
    // 2. Persist to storage
    const savedNote = await storage.createNote(input);

    // 3. Replace temp with real
    setNotes((prev) =>
      prev.map((n) => (n.id === tempNote.id ? savedNote : n))
    );
    return savedNote;
  } catch (error) {
    // 4. Rollback on error
    setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
    throw error;
  }
};
```

## Testing Patterns (Future)

**Component Tests**:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteCard } from "./NoteCard";

describe("NoteCard", () => {
  const mockNote: Note = {
    id: "1",
    title: "Test Note",
    content: "Test content",
    contentType: "markdown",
    tags: ["test"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders note title", () => {
    render(<NoteCard note={mockNote} onClick={() => {}} />);
    expect(screen.getByText("Test Note")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<NoteCard note={mockNote} onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

**Storage Adapter Tests**:
```typescript
import { LocalStorageAdapter } from "./localStorageAdapter";

describe("LocalStorageAdapter", () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  it("creates and retrieves notes", async () => {
    const input: NoteInput = {
      title: "Test",
      content: "Content",
      contentType: "markdown",
      tags: [],
    };

    const created = await adapter.createNote(input);
    expect(created.id).toBeDefined();

    const retrieved = await adapter.getNote(created.id);
    expect(retrieved?.title).toBe("Test");
  });
});
```
