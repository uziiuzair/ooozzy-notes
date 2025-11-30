# Product Context

**Purpose**: Product features, user requirements, and functional specifications for Notes.Ooozzy

**Note**: For comprehensive product vision and incremental build ladder, see [notes.md](../notes.md)

## Feature Overview

### Core Features (MVP)

**Visual Organization** ✅ (In Progress)
- Folder-based organization with bookshelf UI
- Drag-drop notes/photos/links into folders
- Curvy card aesthetics with playful colors
- Grid layout with responsive design

**Quick Capture** ✅ (Implemented)
- Create notes instantly from dashboard
- LocalStorage autosave
- No signup required (anonymous)
- Photo and link capture

**Rich Text Editing** 🔄 (Partial)
- TipTap editor integrated
- Markdown ↔ Rich text support
- Bubble menu for formatting (planned)
- Keyboard shortcuts (planned)

**Search & Filter** ✅ (Implemented)
- Search across notes, photos, links
- Filter by title, content, tags
- Real-time search results
- Folder-aware filtering

**Content Types** ✅ (Implemented)
- Text notes (markdown/richtext)
- Photos with captions and tags
- Web links with metadata
- Unified grid display

### Paid Features (v1.1+) 📅

**AI Features**:
- Summarize selected text
- Rewrite with tone options
- Expand ideas
- Chat with notes (semantic search)
- All AI features require explicit user action

**Private Folders**:
- Password-protected folders
- RLS enforcement (Supabase)
- Private badge and lock UI

**Advanced Features**:
- Full-text search across all content
- OCR for images/PDFs
- Export (Markdown, PDF)
- Semantic search with embeddings

## User Stories

### Quick Capturer Persona

**As a quick capturer, I want to jot down ideas instantly, so that I never lose a thought**

**Acceptance Criteria**:
- [ ] Landing page shows editor (no navigation)
- [x] Note creation takes <1 second
- [x] Autosave on first keystroke
- [ ] No signup required for local notes
- [x] Works on mobile and desktop

**Implementation Status**: 🔄 Partial (autosave pending, anonymous session pending)

**Technical Notes**:
- Use LocalStorage for anonymous users
- Implement debounced autosave (500ms)
- Migrate to Supabase with anonymous sessions

### Visual Organizer Persona

**As a visual organizer, I want to organize notes in folders that look like bookshelves, so that I can find my notes by visual memory**

**Acceptance Criteria**:
- [x] Folders display as curvy cards
- [x] Drag-drop notes into folders
- [x] Click folder to see its contents
- [ ] Customizable folder colors and icons
- [x] Breadcrumb navigation

**Implementation Status**: ✅ Complete (customization pending)

**Technical Notes**:
- Folders use atomic design (FolderCard molecule)
- Drag-drop with HTML5 Drag API
- State tracked in DashboardTemplate

### Web Curator Persona

**As a web curator, I want to save links with previews, so that I can revisit interesting content later**

**Acceptance Criteria**:
- [x] Paste URL anywhere to save
- [x] Extract domain and basic metadata
- [ ] Fetch OpenGraph metadata (title, description, image, favicon)
- [x] Display link cards in grid
- [x] Organize links in folders

**Implementation Status**: 🔄 Partial (OpenGraph pending)

**Technical Notes**:
- Current: Basic URL parsing for domain
- Future: API route `/api/unfurl` to fetch OpenGraph
- Use cheerio or similar for parsing
- Cache metadata in links table

## Feature Specifications

### Note Creation & Editing

**Description**: Create and edit text notes with markdown or rich text

**User Flow**:
1. User clicks "+ Note" button
2. System creates new note with "New Note" title
3. User navigates to note editor page
4. User edits title and content with TipTap
5. System autosaves after 500ms of inactivity
6. User clicks back to return to dashboard

**Requirements**:
- **Functional**:
  - Create note with default title
  - Edit note title and content
  - Autosave to LocalStorage/Supabase
  - Support markdown and richtext
  - Add/remove tags
  - Pin notes to top
- **Non-Functional**:
  - Autosave latency <100ms
  - Editor feels responsive (no lag)
  - No data loss on refresh

**UI/UX**:
- NoteCard: Displays title, preview (150 chars), tags (max 3), last updated
- Note Editor: Full-page with TipTap editor, title input, tag input, back button
- EmptyState: "No notes yet. Click New note to start."

**Data Model**:
```typescript
{
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
```

**API Endpoints** (Future):
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

**Implementation Status**: ✅ Complete (autosave pending, TipTap partial)

**Files Involved**:
- [src/types/note.ts](../src/types/note.ts) - Type definitions
- [src/providers/NotesProvider.tsx](../src/providers/NotesProvider.tsx) - State management
- [src/components/molecules/NoteCard.tsx](../src/components/molecules/NoteCard.tsx) - Card display
- [src/app/note/[id]/page.tsx](../src/app/note/[id]/page.tsx) - Editor page
- [src/lib/storage/localStorageAdapter.ts](../src/lib/storage/localStorageAdapter.ts) - Persistence

### Folder Organization

**Description**: Organize notes, photos, and links into visual folders

**User Flow**:
1. User clicks "+ New Folder"
2. System creates folder with "New Folder" name
3. User can rename folder
4. User drags note/photo/link onto folder card
5. System moves item to folder
6. User clicks folder to view contents
7. User clicks "Back" to return to root

**Requirements**:
- **Functional**:
  - Create/rename/delete folders
  - Drag-drop items into folders
  - Click folder to navigate
  - Breadcrumb navigation
  - Delete folder with cascade option
- **Non-Functional**:
  - Smooth drag-drop (no lag)
  - Clear visual feedback
  - Confirm before deleting non-empty folder

**UI/UX**:
- FolderCard: Displays name, icon, item count, drop zone highlight
- Folder View: Header with back button, unified content grid
- Context Menu: Right-click for "Delete Folder"

**Implementation Status**: ✅ Complete

### Photo Upload

**Description**: Upload photos to notes with captions and tags

**User Flow**:
1. User clicks "+ Photo" button
2. System opens file picker
3. User selects one or multiple images
4. System converts to base64 and stores in LocalStorage
5. System shows photos in grid
6. User can click photo to view full-size
7. User can add caption and tags

**Requirements**:
- **Functional**:
  - Upload single or multiple images
  - Convert to base64 for LocalStorage
  - Display in responsive grid
  - Add caption and tags
  - Organize in folders
- **Non-Functional**:
  - Show quota warnings if near limit
  - Handle QuotaExceededError gracefully
  - Compress large images (future)

**Implementation Status**: ✅ Complete

### Link Capture

**Description**: Capture web links with metadata

**User Flow**:
1. User pastes URL anywhere on page OR clicks "+ Link"
2. System detects URL
3. System extracts domain and basic metadata
4. System saves link to collection
5. System displays link card with favicon, title, domain
6. User can click link to open in new tab

**Requirements**:
- **Functional**:
  - Paste detection (global listener)
  - URL validation
  - Domain extraction
  - Manual "+ Link" button
  - OpenGraph metadata (future)
- **Non-Functional**:
  - Instant capture (<500ms)
  - No duplicate links
  - Handle invalid URLs gracefully

**Implementation Status**: ✅ Complete (OpenGraph pending)

## Business Rules

### Storage Limits

1. **LocalStorage Quota**: Browser-specific (~5-10MB)
   - **Rationale**: Browser limitation
   - **Implementation**: Try-catch with QuotaExceededError, show user-friendly message

2. **Photo Size Warnings**: Warn if approaching quota
   - **Rationale**: Prevent data loss
   - **Implementation**: Check localStorage usage before upload

3. **Supabase Limits** (Future):
   - Free: 100 notes, 1GB assets
   - Paid: Unlimited notes, 20GB assets
   - **Rationale**: Pricing tiers
   - **Implementation**: Check usage in provider, show upgrade prompt

### Access Control

**Anonymous Users**:
- Can create notes locally (LocalStorage)
- Can share public links (base64 in URL)
- Cannot sync across devices
- Cannot access paid features

**Logged-in Free Users**:
- All MVP features
- Cloud sync via Supabase
- Public sharing with slugs
- 100 note limit, 1GB storage

**Paid Users ($5/mo)**:
- All free features
- Private folders
- AI features (summarize, rewrite, chat)
- Unlimited notes
- 20GB storage
- Export features

## Validation Rules

### Note Title
- Type: string
- Required: No (defaults to "Untitled")
- Max Length: 200 characters
- Validation: No special characters in slugs (future)

### Note Content
- Type: string
- Required: No (can be empty)
- Max Length: Unlimited (practical limit from storage)
- Validation: Sanitize HTML for security

### Folder Name
- Type: string
- Required: Yes
- Max Length: 50 characters
- Validation: Must be unique per user

### Photo Upload
- Type: File
- Required: Yes
- Allowed Types: image/jpeg, image/png, image/gif, image/webp
- Max Size: 10MB (configurable)
- Validation: Check mime type, size

### URL
- Type: string
- Required: Yes
- Format: Valid URL with http/https protocol
- Validation: Use URL constructor, catch errors

## Permissions & Access Control

### User Roles (Current: Anonymous)

**Anonymous User**:
- Can create notes locally
- Can view own notes
- Can share public links
- Cannot sync across devices
- Cannot access cloud features

### User Roles (Future: Supabase)

**Logged-in Free**:
- All Anonymous permissions
- Can sync to cloud (Supabase)
- Can create public share links (slugs)
- Limited to 100 notes, 1GB storage

**Paid User**:
- All Free permissions
- Can create private folders
- Can use AI features
- Unlimited notes, 20GB storage
- Can export notes

## Roadmap

### Completed Features (Rungs 0.0-0.3)
- ✅ Rung 0.0: Vision mock (static grid)
- ✅ Rung 0.1: Editable note (in-memory)
- ✅ Rung 0.2: LocalStorage persistence
- ✅ Rung 0.3: Multiple notes with folders
- ✅ Photo upload system
- ✅ Link capture (basic)
- ✅ Unified content grid
- ✅ Search functionality

### In Progress (Rung 0.4)
- 🔄 Anonymous share (URL param with base64)
- 🔄 TipTap editor completion
- 🔄 Autosave implementation

### Planned (Rungs 0.5-1.7)
- 📅 Rung 0.5: Supabase Boot (Auth + DB)
- 📅 Rung 0.6: Cloud Notes (CRUD)
- 📅 Rung 0.7: Public Sharing (slug)
- 📅 Rung 0.8: Folders (Bookshelf enhancement)
- 📅 Rung 0.9: Image Uploads (Supabase Storage)
- 📅 Rung 1.0: Pin from Web (OpenGraph unfurl)
- 📅 Rung 1.1: Basic Search (enhanced)
- 📅 Rung 1.2: Pricing Gate
- 📅 Rung 1.3: Private Folders (paid)
- 📅 Rung 1.4: AI Summarize (paid)
- 📅 Rung 1.5: AI Rewrite (paid)
- 📅 Rung 1.6: AI Talk-to-Notes (paid)
- 📅 Rung 1.7: Full-Text Search + OCR (paid)

### Ideas / Backlog
- 💡 Browser extension for web clipping
- 💡 Mobile PWA with offline support
- 💡 Real-time collaboration
- 💡 Team workspaces
- 💡 API access for developers
- 💡 Integration with Noodle Seed
- 💡 Custom themes and branding

## Known Limitations

1. **LocalStorage Quota**
   - **Description**: Browser limit (~5-10MB) can be exceeded with photos
   - **Workaround**: Delete old photos, use smaller images
   - **Future Plan**: Migrate to Supabase Storage (Rung 0.9)

2. **No Cross-Device Sync**
   - **Description**: Notes stored locally don't sync across devices
   - **Workaround**: Use export feature (future)
   - **Future Plan**: Implement cloud sync with Supabase (Rung 0.6)

3. **Basic Link Metadata**
   - **Description**: Only domain and title extracted, no OpenGraph
   - **Workaround**: Manually add descriptions
   - **Future Plan**: Implement link unfurling API route (Rung 1.0)

4. **No Offline Support**
   - **Description**: App requires internet once migrated to Supabase
   - **Workaround**: None currently
   - **Future Plan**: Service worker + IndexedDB cache

## User Feedback & Issues

### Common Feedback (Expected)
- "I want to sync across devices" - Planned for Rung 0.6
- "Photos take up too much space" - Working on compression
- "I want richer formatting" - TipTap editor in progress

### Known Issues
- Photo upload quota errors can be cryptic - Improved error messages added
- Search doesn't highlight matches - Enhancement for future
- No undo/redo for note editing - TipTap will provide this
