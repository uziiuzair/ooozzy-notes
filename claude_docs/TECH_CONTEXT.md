# Technical Context

**Purpose**: Technology stack, architecture, infrastructure, and technical decisions for Notes.Ooozzy

## Technology Stack

### Frontend
- **Framework**: Next.js 14.2.30
- **React**: v18
- **TypeScript**: v5
- **Styling**: TailwindCSS 3.4.1
- **UI Components**: Custom Atomic Design system
- **Animations**: Framer Motion 12.23.16
- **Rich Text Editor**: TipTap 3.4.4
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-bubble-menu`
  - `@tiptap/extension-floating-menu`
  - `@tiptap/extension-placeholder`
  - `@tiptap/suggestion`

### Backend (Planned)
- **Runtime**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Magic Link)
- **Storage**: Supabase Storage (images/assets)
- **AI**: OpenAI or Anthropic API (wrapper with provider abstraction)

### Current (MVP Development)
- **Storage**: LocalStorage (browser-based)
- **State Management**: React Context + custom hooks
- **Persistence**: LocalStorageAdapter class

### Development Tools
- **Package Manager**: npm
- **Linter**: ESLint 8 (Next.js config)
- **Build Tool**: Next.js built-in (Webpack/Turbopack)
- **Version Control**: Git
- **Type Checking**: TypeScript compiler

### Infrastructure (Planned)
- **Hosting**: Vercel (Next.js native)
- **Database**: Supabase (hosted PostgreSQL)
- **CDN**: Vercel Edge Network
- **Domain**: ooozzy.com (subdomain: notes.ooozzy.com)

## Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│  Next.js App (Client-Side SPA)                          │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │   Components   │  │   Providers    │               │
│  │  (Atomic Design│  │  (React Context)               │
│  │   Hierarchy)   │  │                │               │
│  └────────┬───────┘  └────────┬───────┘               │
│           │                   │                         │
│           └───────┬───────────┘                         │
│                   │                                     │
│           ┌───────▼────────┐                           │
│           │  Custom Hooks  │                           │
│           │ (useNotes, etc)│                           │
│           └───────┬────────┘                           │
│                   │                                     │
│        ┌──────────▼───────────┐                        │
│        │  Storage Adapter     │                        │
│        │    (Interface)       │                        │
│        └──────────┬───────────┘                        │
│                   │                                     │
│      ┌────────────┴─────────────┐                      │
│      │                          │                      │
│ ┌────▼────────┐     ┌───────────▼────────┐            │
│ │LocalStorage │     │ SupabaseAdapter    │            │
│ │  Adapter    │     │    (Planned)       │            │
│ │  (Current)  │     │                    │            │
│ └─────────────┘     └────────────────────┘            │
└─────────────────────────────────────────────────────────┘
           │                           │
           │                           │
┌──────────▼───────┐        ┌─────────▼──────────┐
│  Browser         │        │   Supabase         │
│  LocalStorage    │        │   (PostgreSQL      │
│  (5-10MB limit)  │        │    + Storage       │
│                  │        │    + Auth)         │
│  Keys:           │        │                    │
│  - ooozzy_notes  │        │  Tables:           │
│  - ooozzy_folders│        │  - notes           │
│  - ooozzy_photos │        │  - folders         │
│  - ooozzy_links  │        │  - photos          │
└──────────────────┘        │  - links           │
                            │  - users           │
                            │  - assets          │
                            │  - pins            │
                            │  - embeddings      │
                            └────────────────────┘
```

### Data Flow

**Server-Side Rendering (Initial Load)**:
```
User → Next.js Page → SSR → HTML sent to browser → Hydration
                                                      ↓
                                            Client-side React app active
```

**Client-Side Updates (Current - LocalStorage)**:
```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook (useNotes, useFolders, etc.)
    ↓
Provider State Update
    ↓
LocalStorageAdapter
    ↓
Browser LocalStorage (persist)
    ↓
React Re-render (optimistic UI)
```

**Client-Side Updates (Future - Supabase)**:
```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook
    ↓
Provider State Update (optimistic)
    ↓
SupabaseAdapter
    ↓
Supabase API (with RLS)
    ↓
PostgreSQL Database
    ↓
Real-time Subscription (optional)
    ↓
React Re-render (confirmed state)
```

### Directory Structure

```
notes/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page (dashboard)
│   │   ├── note/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Individual note view/edit
│   │   └── photo/
│   │       └── [id]/
│   │           └── page.tsx    # Individual photo view
│   │
│   ├── components/             # Atomic Design hierarchy
│   │   ├── atoms/              # Basic UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Typography.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Card.tsx
│   │   ├── molecules/          # Simple compositions
│   │   │   ├── SearchBar.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   ├── FolderCard.tsx
│   │   │   ├── PhotoCard.tsx
│   │   │   ├── LinkCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ContextMenu.tsx
│   │   ├── organisms/          # Complex compositions
│   │   │   ├── NotesGrid.tsx
│   │   │   ├── PhotosGrid.tsx
│   │   │   ├── ContentGrid.tsx
│   │   │   └── FolderBookshelf.tsx
│   │   └── templates/          # Page layouts
│   │       └── DashboardTemplate.tsx
│   │
│   ├── providers/              # React Context providers
│   │   ├── AppProvider.tsx     # Root provider (composes all)
│   │   ├── NotesProvider.tsx   # Notes state management
│   │   ├── FoldersProvider.tsx # Folders state management
│   │   ├── PhotosProvider.tsx  # Photos state management
│   │   └── LinksProvider.tsx   # Links state management
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useNotes.ts         # Notes CRUD + search
│   │   ├── useFolders.ts       # Folders CRUD
│   │   └── useProximityEffect.ts # UI effects
│   │
│   ├── lib/                    # Utilities and adapters
│   │   ├── utils.ts            # Utility functions (cn, etc.)
│   │   └── storage/            # Storage abstraction
│   │       ├── index.ts        # Export adapters
│   │       ├── types.ts        # StorageAdapter interface
│   │       └── localStorageAdapter.ts # LocalStorage implementation
│   │
│   └── types/                  # TypeScript type definitions
│       ├── note.ts             # Note, NoteInput, NoteUpdate
│       ├── folder.ts           # Folder, FolderInput, FolderUpdate
│       ├── photo.ts            # Photo, PhotoInput, PhotoUpdate
│       ├── link.ts             # Link, LinkMetadata
│       └── preferences.ts      # User preferences
│
├── public/                     # Static assets
├── claude_docs/                # Memory bank documentation
├── CLAUDE.md                   # Root behavior file
├── notes.md                    # Product vision document
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## Database Architecture

### LocalStorage Collections (Current)

**ooozzy_notes**:
```typescript
interface Note {
  id: string;                    // UUID
  folderId?: string;             // Optional folder reference
  title: string;                 // Note title
  content: string;               // Markdown or rich text
  contentType: "markdown" | "richtext";
  tags: string[];                // Array of tag strings
  isPinned?: boolean;            // Pin to top
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**ooozzy_folders**:
```typescript
interface Folder {
  id: string;                    // UUID
  name: string;                  // Folder name
  color?: string;                // Hex color code
  icon?: string;                 // Icon name or emoji
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**ooozzy_photos**:
```typescript
interface Photo {
  id: string;                    // UUID
  folderId?: string;             // Optional folder reference
  title: string;                 // Photo title
  url: string;                   // Base64 data URL or storage URL
  thumbnailUrl?: string;         // Optional thumbnail for performance
  caption?: string;              // Photo caption
  tags: string[];                // Array of tag strings
  isPinned?: boolean;            // Pin to top
  width?: number;                // Original width in pixels
  height?: number;               // Original height in pixels
  size?: number;                 // File size in bytes
  mimeType?: string;             // e.g., "image/jpeg"
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**ooozzy_links**:
```typescript
interface Link {
  id: string;                    // UUID
  url: string;                   // Original URL
  title: string;                 // Page title (from metadata)
  description?: string;          // Page description
  favicon?: string;              // Favicon URL
  image?: string;                // OpenGraph image URL
  domain: string;                // Extracted domain (e.g., "github.com")
  createdAt: Date;               // Timestamp
  updatedAt: Date;               // Timestamp
  isPinned: boolean;             // Pin to top
  folderId?: string;             // Optional folder reference
}
```

### Supabase Schema (Planned)

**users**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'free', -- 'free' or 'paid'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**folders**:
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own folders"
  ON folders FOR ALL
  USING (auth.uid() = user_id);
```

**notes**:
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_md TEXT,              -- Markdown content
  content_rich JSONB,           -- Rich text (TipTap JSON)
  is_public BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,             -- For public sharing
  cover_asset_id UUID REFERENCES assets(id),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Public notes are viewable by anyone"
  ON notes FOR SELECT
  USING (is_public = true);
```

**assets**:
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'image', 'pdf', etc.
  url TEXT NOT NULL,            -- Supabase Storage URL
  width INTEGER,
  height INTEGER,
  meta JSONB,                   -- Additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**pins**:
```sql
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  site_name TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**embeddings** (for AI semantic search):
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type TEXT NOT NULL,     -- 'note', 'pin', etc.
  owner_id UUID NOT NULL,
  vector vector(1536),          -- OpenAI embedding dimension
  chunk_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops);
```

**events** (analytics):
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,           -- 'create_note', 'pin_url', etc.
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Data Access Patterns

**Read Operations**:
- Get all notes for user: Filter by `user_id` with RLS
- Get notes in folder: Filter by `folder_id`
- Search notes: Full-text search on `title` and `content_md`
- Get public note: Filter by `slug` and `is_public = true`

**Write Operations**:
- Create note: Insert with `user_id` from auth context
- Update note: Update with RLS verification
- Delete note: Soft delete or hard delete with CASCADE

**Optimization Strategies**:
- Index on `user_id` for all tables (primary query pattern)
- Index on `folder_id` for notes/photos/links
- Index on `slug` for public note lookups
- Index on `is_public` for public note queries
- GIN index on `tags` array for tag searches
- Vector index on embeddings for semantic search

## Storage Adapter System

### Interface Definition

```typescript
// src/lib/storage/types.ts
export interface StorageAdapter {
  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(noteInput: NoteInput): Promise<Note>;
  updateNote(id: string, updates: NoteUpdate): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  searchNotes(query: string): Promise<Note[]>;
  getNotesByFolder(folderId: string): Promise<Note[]>;
  getNotesByTags(tags: string[]): Promise<Note[]>;
  deleteNotesByFolder(folderId: string): Promise<void>;

  // Folders
  getFolders(): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | null>;
  createFolder(folderInput: FolderInput): Promise<Folder>;
  updateFolder(id: string, updates: FolderUpdate): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  // Photos
  getPhotos(): Promise<Photo[]>;
  savePhotos(photos: Photo[]): Promise<void>;
  deletePhotosByFolder(folderId: string): Promise<void>;

  // Links
  getLinks(): Promise<Link[]>;
  saveLinks(links: Link[]): Promise<void>;
  deleteLinksByFolder(folderId: string): Promise<void>;
}
```

### Current Implementation (LocalStorage)

```typescript
// src/lib/storage/localStorageAdapter.ts
export class LocalStorageAdapter implements StorageAdapter {
  private readonly NOTES_KEY = "ooozzy_notes";
  private readonly FOLDERS_KEY = "ooozzy_folders";
  private readonly PHOTOS_KEY = "ooozzy_photos";
  private readonly LINKS_KEY = "ooozzy_links";

  // Implementation uses crypto.randomUUID() for IDs
  // Stores data as JSON strings in localStorage
  // Error handling with try-catch and console.error
}
```

### Future Implementation (Supabase)

```typescript
// src/lib/storage/supabaseAdapter.ts (planned)
export class SupabaseAdapter implements StorageAdapter {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async getNotes(): Promise<Note[]> {
    const { data, error } = await this.supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // ... more methods following StorageAdapter interface
}
```

## Authentication System (Planned)

### Session Flow

**Sign In (Magic Link)**:
```
1. User enters email
2. Supabase sends magic link
3. User clicks link
4. Supabase creates session
5. Redirect to app with session cookie
6. App reads session from Supabase Auth
```

**Session Validation**:
```
1. Every request checks Supabase session
2. RLS policies enforce user_id match
3. Expired sessions redirect to login
4. Anonymous users get temp session (local only)
```

### Security Measures

**Row Level Security (RLS)**:
- All tables have RLS enabled
- Policies enforce `auth.uid() = user_id`
- Public content has separate read policy
- Cross-user access blocked at database level

**Authentication**:
- Magic Link (passwordless)
- No password storage
- Session tokens in httpOnly cookies
- CSRF protection via Supabase

**Data Protection**:
- Private folders enforce `is_private` check
- Public links use random slugs (not sequential IDs)
- Signed URLs for assets (time-limited)
- No PII in public URLs

## API Design (Planned)

### Route Structure

```
/api/
  ├── notes/
  │   ├── route.ts            GET, POST   List/Create notes
  │   └── [id]/
  │       └── route.ts        GET, PATCH, DELETE   Note operations
  ├── folders/
  │   ├── route.ts            GET, POST   List/Create folders
  │   └── [id]/
  │       └── route.ts        GET, PATCH, DELETE   Folder operations
  ├── upload/
  │   └── route.ts            POST        Image upload
  ├── unfurl/
  │   └── route.ts            POST        Link metadata extraction
  └── ai/
      ├── summarize/
      │   └── route.ts        POST        AI summarize
      ├── rewrite/
      │   └── route.ts        POST        AI rewrite
      └── chat/
          └── route.ts        POST        AI chat with notes
```

### Response Format

**Success**:
```json
{
  "data": { /* resource data */ },
  "success": true
}
```

**Error**:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional error details */ }
}
```

### HTTP Status Codes

- **200**: Successful GET/PATCH/DELETE
- **201**: Successful POST (resource created)
- **400**: Bad request (validation error)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (not authorized)
- **404**: Not found
- **429**: Rate limit exceeded
- **500**: Internal server error

## Build & Deployment

### Development

```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

### Environment Variables

**.env.local**:
```bash
# Supabase (planned)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI API (planned)
OPENAI_API_KEY=sk-xxx
# OR
ANTHROPIC_API_KEY=sk-ant-xxx

# App Config
NEXT_PUBLIC_APP_URL=https://notes.ooozzy.com
NEXT_PUBLIC_MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
```

### Build Configuration

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['xxx.supabase.co'],  // Supabase Storage
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
```

**tailwind.config.ts**:
- Custom color palette (electric-violet, heliotrope, french-rose, etc.)
- Custom border radius (rounded-2xl default)
- Custom shadows (soft, subtle)
- Dark mode support (class-based)

## Performance Considerations

### Current Optimizations

**LocalStorage Performance**:
- Data stored as JSON strings (minimized)
- Batch reads/writes when possible
- Debounced autosave (500ms)

**Component Optimization**:
- React.memo for expensive components
- useCallback for stable function references
- Lazy loading for heavy components

**Image Handling**:
- Base64 encoding for LocalStorage
- Resize before storage if needed
- Show size warnings to users

### Bottlenecks & Solutions

**Problem**: LocalStorage quota exceeded
**Solution**: Migrate to Supabase Storage, implement quota warnings, compress images

**Problem**: Slow note search
**Solution**: Implement debounced search, use Supabase full-text search

**Problem**: Large note content slows editor
**Solution**: Virtualize long documents, lazy load attachments

## Technical Debt

### Known Issues

1. **LocalStorage Limitations**
   - Current: 5-10MB browser limit, no persistence across devices
   - Future: Migrate to Supabase for cloud storage
   - Impact: Users may hit quota, lose data on device change

2. **No Offline Support**
   - Current: Requires internet for Supabase (once migrated)
   - Future: Implement service worker + IndexedDB cache
   - Impact: Can't use app offline

3. **No Real-time Collaboration**
   - Current: Single-user only
   - Future: Supabase real-time subscriptions for multi-device sync
   - Impact: Edits on one device don't reflect on another instantly

### Future Improvements

**Short Term** (Next 2-4 weeks):
- Complete TipTap editor integration
- Implement anonymous sharing (rung 0.4)
- Migrate to Supabase (rungs 0.5-0.6)

**Medium Term** (1-2 months):
- Implement OpenGraph link unfurling
- Add full-text search
- Implement payment flow (Stripe)

**Long Term** (3+ months):
- AI features (summarize, rewrite, chat)
- Semantic search with embeddings
- Export features (Markdown, PDF)
- Mobile PWA optimizations

## Dependencies

### Core Dependencies

```json
{
  "next": "14.2.30",
  "react": "^18",
  "react-dom": "^18",
  "@tiptap/react": "^3.4.4",
  "@tiptap/starter-kit": "^3.4.4",
  "framer-motion": "^12.23.16",
  "tailwindcss": "^3.4.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "eslint": "^8",
  "eslint-config-next": "14.2.30",
  "postcss": "^8"
}
```

### Planned Dependencies

```json
{
  "@supabase/supabase-js": "^2",
  "@supabase/auth-helpers-nextjs": "^0",
  "openai": "^4",          // OR
  "@anthropic-ai/sdk": "^0",
  "zod": "^3",            // Validation
  "stripe": "^14"         // Payments
}
```

## Security Considerations

### Implemented

✅ TypeScript for type safety
✅ ESLint for code quality
✅ Client-side validation (basic)
✅ Error boundaries (React)

### To Implement

🔄 Input sanitization (XSS prevention)
🔄 CSRF protection (Supabase built-in)
🔄 Rate limiting (API routes)
🔄 Content Security Policy headers
🔄 Supabase RLS policies
🔄 Signed URLs for assets
🔄 AI cost guards and rate limits

## Monitoring & Logging

### Current State

**Logging**:
- Console.error for errors
- No structured logging
- No error tracking service

**Monitoring**:
- Browser DevTools only
- No performance monitoring
- No analytics

### Future Plans

**Logging** (planned):
- Sentry for error tracking
- Structured logs for API routes
- User action events to Supabase

**Monitoring** (planned):
- Vercel Analytics for performance
- Supabase metrics for database
- Custom analytics for product metrics

**Analytics Events** (from notes.md):
- `create_note`, `update_note`, `pin_url`
- `upload_asset`, `share_note`, `toggle_private`
- `ai_action(type)`, `search(query_len)`
- `upgrade_clicked`, `export(type)`

## Scalability Considerations

### Current Capacity

- **Users**: Single-user (no auth yet)
- **Storage**: LocalStorage (~5MB per user)
- **Performance**: Client-side only (no server load)

### Scaling Strategies

**Horizontal Scaling** (Supabase):
- Database replication for reads
- Connection pooling (Supavisor)
- CDN for static assets (Vercel Edge)

**Vertical Scaling**:
- Optimize queries (indexes, materialized views)
- Cache frequently accessed data (Redis)
- Lazy load components and assets

**Cost Management**:
- Free tier: Supabase (500MB DB, 1GB storage)
- Paid tier: Scale to Pro ($25/mo) at ~1000 users
- AI usage: Rate limit per user, token budgets

## Development Workflow

### Local Development

1. Clone repository
2. `npm install`
3. Copy `.env.example` to `.env.local`
4. `npm run dev`
5. Open http://localhost:3000

### Code Standards

- TypeScript strict mode
- ESLint with Next.js config
- Prettier for formatting (optional)
- Conventional commits

### Testing Strategy (Future)

**Unit Tests** (planned):
- Jest + React Testing Library
- Test components in isolation
- Test storage adapters

**Integration Tests** (planned):
- Playwright for E2E tests
- Test critical user flows
- Test across browsers

**Performance Tests**:
- Lighthouse CI
- Bundle size monitoring
- TTI and P95 metrics

### Deployment Process

**Vercel Deploy** (planned):
1. Push to main branch
2. Vercel auto-deploys preview
3. Review and test
4. Promote to production
5. Monitor metrics

### Version Control

- **Branching**: main branch (no feature branches yet, solo dev)
- **Commits**: Conventional commits (feat:, fix:, refactor:, docs:)
- **Tags**: Version tags (v0.1.0, v0.2.0, etc.) aligned with rungs
