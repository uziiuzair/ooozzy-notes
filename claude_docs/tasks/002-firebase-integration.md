# Task: Firebase Integration (Auth, Firestore, Middleware)

**Task ID**: 002
**Status**: done
**Created**: 2025-01-30
**Started**: 2025-01-30
**Completed**: 2025-01-30
**Assigned To**: Claude
**Rung**: 0.5 (Supabase Boot → Firebase Boot)

## Objective

Migrate from LocalStorage to Firebase with:
1. **Firebase Authentication** (Password + Gmail login)
2. **Firestore Database** (structured collections matching current schema)
3. **Authentication Middleware** (protect routes, authenticated users only)

## Context

**Current State**:
- LocalStorage for all data (notes, folders, photos, links)
- No authentication (anonymous usage)
- Firebase config exists at `src/lib/firebase/config.ts`
- Gemini AI already configured

**Why This Task**:
- Enable multi-device sync and cloud persistence
- Prepare for user accounts and sharing features
- Unlock future rungs (0.6: Cloud Notes, 0.7: Public Sharing)
- Firebase chosen over Supabase (already configured)

**Dependencies**:
- Firebase project: `ooozzy-notes` (already initialized)
- Enabled auth methods: Email/Password + Google Sign-In
- Empty Firestore database ready for schema setup

## Requirements

### Must Have
- [ ] Firebase Authentication with Email/Password and Google Sign-In
- [ ] Firestore database schema matching SCHEMA.json structure
- [ ] Authentication middleware protecting all routes except `/login` and `/signup`
- [ ] FirestoreAdapter implementing existing StorageAdapter interface
- [ ] Data migration path from LocalStorage to Firestore
- [ ] Security Rules for Firestore (user isolation)
- [ ] Preserve existing UI/UX (no breaking changes to components)

### Nice to Have
- [ ] Auth state persistence across sessions
- [ ] "Remember me" functionality
- [ ] Password reset flow
- [ ] Email verification
- [ ] Migration tool UI for existing LocalStorage users

## Acceptance Criteria

### 1. Firebase Authentication
- [ ] Email/Password sign-up flow works (new users can create accounts)
- [ ] Email/Password sign-in flow works (returning users can log in)
- [ ] Google Sign-In flow works (OAuth redirect and auth)
- [ ] Auth state persists across page refreshes
- [ ] Sign-out functionality works correctly
- [ ] Auth errors display user-friendly messages
- [ ] Auth state available via React Context/hooks

### 2. Firestore Database Schema
- [ ] Collections created: `users`, `notes`, `folders`, `photos`, `links`
- [ ] Schema matches SCHEMA.json field definitions
- [ ] User ID properly linked to all user data (notes, folders, photos, links)
- [ ] Timestamps use Firestore serverTimestamp() for consistency
- [ ] UUIDs preserved for client-generated IDs where appropriate
- [ ] Indexes created for common queries (userId, folderId, createdAt)

### 3. Firestore Security Rules
- [ ] Users can only read/write their own data
- [ ] RLS-equivalent security (user isolation enforced)
- [ ] Admin/service account access for future features
- [ ] Public read rules prepared for future sharing features (disabled for now)
- [ ] Rate limiting considerations documented

### 4. Authentication Middleware
- [ ] `middleware.ts` created at project root
- [ ] Redirects unauthenticated users to `/login`
- [ ] Allows access to `/login`, `/signup`, `/forgot-password` without auth
- [ ] Preserves redirect path after successful login
- [ ] Works with Next.js 14 App Router conventions
- [ ] SSR-safe (no client-side only checks)

### 5. Storage Adapter Pattern
- [ ] `FirestoreAdapter` implements `StorageAdapter` interface
- [ ] CRUD operations for notes, folders, photos, links
- [ ] Proper error handling with user-friendly messages
- [ ] Loading states for async operations
- [ ] Optimistic updates where appropriate
- [ ] Real-time updates with Firestore listeners (optional for MVP)

### 6. Data Migration
- [ ] Migration utility to move LocalStorage data to Firestore
- [ ] One-time migration on first authenticated login
- [ ] Preserves all existing data (notes, folders, photos, links)
- [ ] Handles duplicate prevention (idempotent migration)
- [ ] User confirmation before migration (don't auto-migrate silently)

### 7. Quality Gates
- [ ] TypeScript build passes
- [ ] No console errors in browser
- [ ] Works on desktop + mobile
- [ ] Performance <500ms for CRUD operations
- [ ] Memory bank updated (ACTIVE_CONTEXT.md, PROGRESS.md)
- [ ] User data persists correctly in Firestore

## Technical Approach

### Phase 1: Authentication Setup
**Files to Create**:
- `src/lib/firebase/auth.ts` - Auth utilities (sign up, sign in, sign out)
- `src/providers/AuthProvider.tsx` - Auth state management
- `src/hooks/useAuth.ts` - Custom hook for auth state
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/signup/page.tsx` - Sign-up page
- `src/components/molecules/AuthForm.tsx` - Reusable auth form
- `src/components/atoms/GoogleSignInButton.tsx` - Google OAuth button

**Pattern**: React Context + custom hooks (consistent with existing providers)

### Phase 2: Firestore Schema Setup
**Files to Create**:
- `src/lib/firebase/firestore.ts` - Firestore initialization
- `src/lib/firebase/schema.ts` - Type-safe collection references
- `firestore.rules` - Security rules file (project root)

**Collections Structure**:
```typescript
users/
  {userId}/
    profile: { email, displayName, photoURL, createdAt, updatedAt }

notes/
  {noteId}/
    userId: string
    folderId?: string
    title: string
    content: string
    contentType: 'markdown' | 'richtext'
    tags: string[]
    isPinned?: boolean
    createdAt: Timestamp
    updatedAt: Timestamp

folders/
  {folderId}/
    userId: string
    name: string
    color?: string
    icon?: string
    createdAt: Timestamp
    updatedAt: Timestamp

photos/
  {photoId}/
    userId: string
    folderId?: string
    title: string
    url: string (Firebase Storage URL, not base64)
    thumbnailUrl?: string
    caption?: string
    tags: string[]
    isPinned?: boolean
    width?: number
    height?: number
    size?: number
    mimeType?: string
    createdAt: Timestamp
    updatedAt: Timestamp

links/
  {linkId}/
    userId: string
    folderId?: string
    url: string
    title: string
    description?: string
    favicon?: string
    image?: string
    domain: string
    isPinned: boolean
    createdAt: Timestamp
    updatedAt: Timestamp
```

### Phase 3: Storage Adapter
**Files to Create**:
- `src/lib/storage/FirestoreAdapter.ts` - Firestore implementation of StorageAdapter
- `src/lib/storage/index.ts` - Adapter factory (switch between Local/Firestore)

**Files to Modify**:
- `src/providers/NotesProvider.tsx` - Use FirestoreAdapter when authenticated
- `src/providers/FoldersProvider.tsx` - Use FirestoreAdapter when authenticated
- `src/providers/PhotosProvider.tsx` - Use FirestoreAdapter + Firebase Storage
- `src/providers/LinksProvider.tsx` - Use FirestoreAdapter when authenticated

**Pattern**: Environment-based adapter selection
```typescript
const adapter = user ? new FirestoreAdapter(user.uid) : new LocalStorageAdapter();
```

### Phase 4: Authentication Middleware
**Files to Create**:
- `middleware.ts` - Next.js middleware at project root

**Implementation**:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check auth state
  // Redirect to /login if unauthenticated
  // Allow public routes: /login, /signup, /forgot-password
  // Preserve original path for post-login redirect
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Phase 5: Data Migration
**Files to Create**:
- `src/lib/migration/localStorageToFirestore.ts` - Migration utility
- `src/components/organisms/MigrationPrompt.tsx` - UI for migration confirmation

**Migration Logic**:
1. Detect existing LocalStorage data
2. Prompt user on first authenticated login
3. Migrate notes, folders, photos, links to Firestore
4. Store migration flag in localStorage (prevent re-migration)
5. Optionally clear LocalStorage after successful migration

## Files to Modify/Create

### Create
- [ ] `src/lib/firebase/auth.ts` - Auth utilities
- [ ] `src/lib/firebase/firestore.ts` - Firestore init
- [ ] `src/lib/firebase/schema.ts` - Type-safe collections
- [ ] `src/providers/AuthProvider.tsx` - Auth state
- [ ] `src/hooks/useAuth.ts` - Auth hook
- [ ] `src/lib/storage/FirestoreAdapter.ts` - Firestore storage
- [ ] `src/lib/storage/index.ts` - Adapter factory
- [ ] `src/app/(auth)/login/page.tsx` - Login page
- [ ] `src/app/(auth)/signup/page.tsx` - Signup page
- [ ] `src/components/molecules/AuthForm.tsx` - Auth form component
- [ ] `src/components/atoms/GoogleSignInButton.tsx` - OAuth button
- [ ] `middleware.ts` - Auth middleware (project root)
- [ ] `firestore.rules` - Security rules (project root)
- [ ] `src/lib/migration/localStorageToFirestore.ts` - Migration tool
- [ ] `src/components/organisms/MigrationPrompt.tsx` - Migration UI

### Modify
- [ ] `src/providers/AppProvider.tsx` - Add AuthProvider wrapper
- [ ] `src/providers/NotesProvider.tsx` - Use FirestoreAdapter when authenticated
- [ ] `src/providers/FoldersProvider.tsx` - Use FirestoreAdapter when authenticated
- [ ] `src/providers/PhotosProvider.tsx` - Use FirestoreAdapter when authenticated
- [ ] `src/providers/LinksProvider.tsx` - Use FirestoreAdapter when authenticated
- [ ] `src/lib/firebase/config.ts` - Add Firestore and Auth imports
- [ ] `package.json` - Ensure firebase dependencies installed
- [ ] `.env.local` - Add Firebase config (if not hardcoded)
- [ ] `claude_docs/SCHEMA.json` - Update to reflect Firebase migration
- [ ] `claude_docs/ACTIVE_CONTEXT.md` - Document Firebase as primary backend

## Testing Checklist

### Authentication Tests
- [ ] New user can sign up with email/password
- [ ] Existing user can log in with email/password
- [ ] User can sign in with Google OAuth
- [ ] User can sign out successfully
- [ ] Auth state persists across page refresh
- [ ] Unauthenticated access redirects to /login
- [ ] Post-login redirect to original path works
- [ ] Error messages display for invalid credentials

### Firestore CRUD Tests
- [ ] Create note → appears in Firestore
- [ ] Update note → Firestore updates
- [ ] Delete note → removed from Firestore
- [ ] Same for folders, photos, links
- [ ] Multi-user isolation (User A can't see User B's data)
- [ ] Real-time updates work (optional)

### Migration Tests
- [ ] LocalStorage data migrates to Firestore on first login
- [ ] Migration preserves all fields correctly
- [ ] No duplicate data created
- [ ] Migration prompt shows only once
- [ ] User can decline migration (continue with LocalStorage)

### Performance Tests
- [ ] CRUD operations <500ms
- [ ] Auth flow <2s
- [ ] No blocking UI during async operations
- [ ] Optimistic updates feel instant

### Edge Case Tests
- [ ] Network offline → graceful error handling
- [ ] Firestore quota exceeded → user-friendly message
- [ ] Large dataset (100+ notes) → still performant
- [ ] Rapid CRUD operations → no race conditions

## Dependencies

**Requires**:
- Firebase project configured (✅ already done)
- Email/Password auth enabled (✅ already done)
- Google Sign-In enabled (✅ already done)
- Firestore database created (✅ already done)

**Blocks**:
- Task 003: Event Integration with Firebase (emit auth events)
- Rung 0.6: Cloud Notes (depends on Firestore setup)
- Rung 0.7: Public Sharing (depends on auth + Firestore)

**Related**:
- Task 001: Events Provider System (will emit auth/CRUD events)
- SCHEMA.json: Database schema definition

## Progress Log

### [YYYY-MM-DD HH:MM]
[Updates will be logged here as work progresses]

## Completion Notes

**Status**: [todo → in_progress → done]
**Completed**: [YYYY-MM-DD]

**Summary**: [What was accomplished]

**Files Changed**:
[List of files modified/created]

**Lessons Learned**:
[Document any challenges, decisions, or insights]

**Follow-up Tasks**:
[Any new tasks identified during implementation]
