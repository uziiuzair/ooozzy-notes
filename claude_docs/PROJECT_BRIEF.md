# Project Brief

## Project Overview

**Project Name**: Notes.Ooozzy
**Organization**: Ooozzy (playful micro-tools brand)
**Project Type**: Consumer web application
**Status**: MVP Development (Rung 0.3-0.4)
**Start Date**: January 2025

## Executive Summary

Notes.Ooozzy is a playful, fast notes app that combines a visual bookshelf UI with text+media capture, web pinning, and light-but-powerful AI features. It's the successor to QuickMDE, designed to make capturing, organizing, and growing ideas delightful and instant.

The app differentiates through its visual bookshelf (curvy cards), text-first editor with optional images & pins, and AI that summarizes/rewrites/expands/talks to notes only when explicitly asked. Every interaction targets sub-500ms response time with zero-blocking onboarding.

Target users can start capturing notes immediately without signup, organize visually in folders as bookshelves, pin content from the web, create visual lookbooks, and optionally upgrade for AI features and private folders.

## Business Objectives

### Primary Goals
1. **Instant Capture**: Make note-taking frictionless - landing page is the editor, save on first keystroke
2. **Visual Organization**: Transform folders into beautiful bookshelves with curvy card aesthetics
3. **AI Enhancement**: Provide powerful AI features (summarize, rewrite, expand, chat) but only when users explicitly ask

### Success Criteria
- ✅ Sub-500ms P95 interaction time
- ✅ Sub-2s TTI (Time to Interactive) on 3G Fast
- 🔄 Weekly Active Creators metric (users creating ≥1 note or pin per week)
- 🔄 Zero-blocking onboarding experience
- 🔄 Security audit basic pass (RLS prevents cross-user access)

## Target Audience

**Primary Users**: Knowledge workers, students, creatives, researchers

**User Personas**:
- **Quick Capturer**: Needs to jot down ideas instantly without friction
- **Visual Organizer**: Prefers visual organization over hierarchical folders
- **Web Curator**: Saves interesting links and articles for later reference
- **Creative Collector**: Builds visual lookbooks and mood boards
- **AI Power User**: Uses AI to summarize, rewrite, and chat with notes (paid tier)

**Access Control**:
- Anonymous users: Create notes, share public, local-only storage
- Logged-in Free: All MVP features + cloud sync
- Paid ($5/mo): Private folders, AI features, exports, advanced search

## Scope

### Phase 1 - MVP (Rungs 0.0-1.0) ✅🔄📅

**Rung 0.0 - Vision Mock (static)** ✅
- Static grid with static note card
- Read-only note view on click

**Rung 0.1 - Local Note (in-memory)** ✅
- Editable note with state-only save
- Refresh loses content

**Rung 0.2 - LocalStorage Persistence** ✅
- Store one note in localStorage
- Clear button to wipe

**Rung 0.3 - Multiple Notes** ✅ (Current)
- Dashboard grid lists multiple notes
- Create/update/delete operations
- Folders with drag-drop
- Photos and links support

**Rung 0.4 - Anonymous Share** 📅 (Next)
- Copy link with base64 note content
- Read-only public view

**Rung 0.5 - Supabase Boot** 📅
- Magic Link authentication
- Session management
- Database skeleton

**Rung 0.6 - Cloud Notes (CRUD)** 📅
- Store notes in Supabase
- RLS per user
- Cloud sync

**Rung 0.7 - Public Sharing (slug)** 📅
- Notes have `is_public` + `slug`
- Public route for read-only sharing

**Rung 0.8 - Folders (Bookshelf)** 📅
- `folders` table in Supabase
- Enhanced bookshelf UI
- Folder assignment

**Rung 0.9 - Image Uploads (Lookbook-lite)** 📅
- Drag-drop images into notes
- Supabase Storage integration

**Rung 1.0 - Pin from Web (unfurl)** 📅
- Paste URL → fetch OpenGraph tags
- Save preview card with metadata

**Rung 1.1 - Basic Search** 📅
- Header search filters dashboard
- Title and tag search

### Phase 2 - v1.1 (Paid Features) 📅

**Rung 1.2 - Pricing Gate (soft)** 📅
- Upgrade drawer listing paid features
- Payment integration

**Rung 1.3 - Private Folders (paid)** 📅
- RLS enforces `is_private`
- UI badge + lock screen

**Rung 1.4 - AI Summarize** 📅
- Select text → Summarize
- New block with attribution

**Rung 1.5 - AI Rewrite** 📅
- Rewrite with tone options
- Diff preview before applying

**Rung 1.6 - AI Talk-to-Notes** 📅
- Embeddings + vector search
- Chat limited to user's notes

**Rung 1.7 - Full-Text Search + OCR** 📅
- Search body text
- OCR for images/PDFs (paid)

### Out of Scope (Current Phase)
- Mobile native apps (web-first approach)
- Real-time collaboration
- Advanced permission management
- Third-party integrations (beyond basic sharing)
- Custom themes/branding
- API access for developers

### Future Considerations
- Export: Markdown zip, PDF
- "Send to Noodle Seed" integration
- Semantic search across all content
- Browser extension for web clipping
- Mobile PWA optimization
- Team workspaces

## Technical Approach

### Architecture Decisions

**Framework: Next.js 14**
- React Server Components for performance
- App Router for modern routing
- Built-in image optimization
- ISR/SSR for public pages

**Database: Supabase (planned, currently LocalStorage)**
- PostgreSQL with RLS (Row Level Security)
- Real-time subscriptions
- Storage for images/assets
- Authentication with Magic Link

**Authentication: Supabase Auth**
- Magic Link for passwordless login
- Session management
- RLS integration
- Anonymous session support

**Styling: TailwindCSS**
- Utility-first approach
- Custom playful color palette
- Responsive by default
- Dark mode support (planned)

**Editor: TipTap**
- Rich text editing
- Markdown compatibility
- Extensible with plugins
- Bubble and floating menus

### Design Patterns

**Atomic Design Component Hierarchy**:
```
atoms/          → Button, Input, Typography, Badge, Card
molecules/      → SearchBar, NoteCard, FolderCard, PhotoCard
organisms/      → NotesGrid, PhotosGrid, ContentGrid, FolderBookshelf
templates/      → DashboardTemplate, NoteEditorTemplate
```

**Provider Pattern for State**:
```
AppProvider
├── NotesProvider (manages notes state + CRUD)
├── FoldersProvider (manages folders state + CRUD)
├── PhotosProvider (manages photos state + uploads)
└── LinksProvider (manages links state + metadata)
```

**Storage Adapter Pattern**:
```typescript
interface StorageAdapter {
  getNotes(): Promise<Note[]>
  createNote(input: NoteInput): Promise<Note>
  // ... more methods
}

// Current: LocalStorageAdapter
// Future: SupabaseAdapter
```

## Key Features

### Visual Bookshelf
- Folders displayed as bookshelf-style collections
- Curvy cards with subtle shadows
- Buttery transitions (Framer Motion)
- Drag-drop organization

### Quick Capture
- Landing page = editor (no navigation needed)
- Autosave on first keystroke
- No signup required for local notes
- Keyboard-first with `/` menu

### Rich Text Editing
- TipTap editor with Markdown support
- Bubble menu for formatting
- Floating menu for block commands
- Placeholder text for guidance

### Web Pinning
- Paste URL anywhere to capture
- OpenGraph metadata extraction
- Favicon and thumbnail display
- Domain and title parsing

### Visual Lookbooks
- Drag-drop image uploads
- Grid layout with captions
- Cover image selection
- Tag-based organization

### AI Features (Paid, v1.1+)
- Summarize selected text
- Rewrite with tone options
- Expand ideas
- Chat with your notes (semantic search)
- Rate-limited with cost guards

## Constraints & Assumptions

### Technical Constraints
- LocalStorage 5-10MB limit (current implementation)
- Browser compatibility: Modern browsers only (ES2020+)
- Image optimization required for performance
- AI features require backend API (cost considerations)

### Business Constraints
- Solo developer (Uzair) - ship incrementally
- Cost-conscious (Supabase free tier initially)
- AI usage needs rate limiting and cost guards
- Payment processing (Stripe) for paid tier

### Assumptions
- Users prefer visual organization over traditional folders
- Instant capture without signup is a key differentiator
- AI features drive upgrade to paid tier
- Sub-500ms interactions are achievable with optimization
- LocalStorage → Supabase migration path is smooth

## Risk Management

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| LocalStorage quota exceeded | High | Implement quota warnings, migrate to Supabase early |
| TipTap performance issues | Medium | Profile editor, lazy load if needed |
| Supabase migration complexity | High | Design storage adapter interface upfront |
| AI cost overruns | High | Implement rate limiting, token budgets, cost monitoring |

### Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User data loss | Critical | Implement robust error handling, backups, export features |
| Performance degradation | High | Monitor P95 metrics, optimize critical paths |
| Security vulnerabilities | Critical | Implement RLS, audit regularly, sanitize inputs |
| Abuse of AI features | Medium | Rate limiting, CAPTCHA if needed, usage monitoring |

## Timeline

### Completed Milestones
- ✅ **M0**: Vision mock and static prototype (Week 1)
- ✅ **M1**: LocalStorage persistence with CRUD (Week 1-2)
- ✅ **M2**: Multiple notes with folders (Week 2-3)
- ✅ **M3**: Photos and links support (Week 3-4)

### Upcoming Milestones
- 🔄 **M4**: Memory bank system setup (Week 4)
- 📅 **M5**: Anonymous sharing via URL (Week 5)
- 📅 **M6**: Supabase integration (Auth + DB) (Week 6-7)
- 📅 **M7**: Cloud sync with RLS (Week 7-8)
- 📅 **M8**: Public sharing with slugs (Week 8)
- 📅 **M9**: Link unfurling with OpenGraph (Week 9-10)
- 📅 **M10**: MVP launch (Week 10-12)

## Success Metrics

### Operational Metrics
- **WAU (Weekly Active Creators)**: Target ≥100 creators in first month
- **Note Creation Rate**: Target ≥3 notes per active user per week
- **Share Rate**: Target ≥20% of notes shared publicly
- **Retention**: Target ≥40% D7 retention

### Technical Metrics
- **P95 Interaction Time**: <500ms (critical)
- **TTI (Time to Interactive)**: <2s on 3G Fast
- **Lighthouse Score**: ≥90 performance, ≥95 accessibility
- **Error Rate**: <0.1% for critical operations

### Business Metrics
- **Conversion to Paid**: Target ≥5% in first 3 months
- **Churn Rate**: Target <10% monthly for paid users
- **AI Feature Usage**: Target ≥60% of paid users using AI weekly
- **NPS (Net Promoter Score)**: Target ≥50

## Stakeholders

### Project Team
- **Builder/Developer**: Uzair Hayat (full-stack development, product decisions)
- **AI Co-pilot**: Claude (development assistance, code generation, documentation)

### Users
- **Early Adopters**: Power users testing MVP features
- **Beta Testers**: Wider audience for v1.0 launch
- **Paid Users**: Customers who upgrade for AI features (v1.1+)

## Budget & Resources

### Development Resources
- Solo developer (Uzair)
- AI assistance (Claude)
- Open source tools and libraries

### Infrastructure Costs
- **Supabase**: Free tier initially, scale to Pro ($25/mo) as needed
- **Domain**: ~$15/year
- **AI API (OpenAI/Anthropic)**: Variable, estimated $50-200/mo with rate limiting
- **Total Monthly**: <$50 for MVP, scaling to ~$300/mo at 1000 paid users

### Time Investment
- **MVP**: 4-6 weeks (rungs 0.0-1.1)
- **v1.1 (Paid)**: +4-6 weeks (rungs 1.2-1.7)
- **Total**: ~8-12 weeks to launch with paid features

## Contact & Documentation

**Project Lead**: Uzair Hayat
**Documentation**: `claude_docs/` directory
**Product Vision**: `notes.md`
**Schema Reference**: `claude_docs/SCHEMA.json`
**Repository**: Local development

**Key Documents**:
- **This file**: High-level project overview
- **TECH_CONTEXT.md**: Technical architecture and stack
- **PRODUCT_CONTEXT.md**: Detailed feature specifications
- **PROGRESS.md**: Implementation history and decisions
- **ACTIVE_CONTEXT.md**: Current work status and next steps
- **SYSTEM_PATTERNS.md**: Code patterns and conventions
