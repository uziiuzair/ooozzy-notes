import { LocalStorageAdapter } from "@/lib/storage/localStorageAdapter";
import { FirestoreAdapter } from "@/lib/storage/firestoreAdapter";

const MIGRATION_FLAG_KEY = "ooozzy_migration_completed";

export interface MigrationResult {
  success: boolean;
  notesCount: number;
  foldersCount: number;
  photosCount: number;
  linksCount: number;
  errors: string[];
}

/**
 * Check if migration has already been completed
 */
export function isMigrationCompleted(): boolean {
  try {
    return localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Check if there's LocalStorage data to migrate
 */
export async function hasLocalStorageData(): Promise<boolean> {
  const localAdapter = new LocalStorageAdapter();

  try {
    const [notes, folders, photos, links] = await Promise.all([
      localAdapter.getNotes(),
      localAdapter.getFolders(),
      localAdapter.getPhotos(),
      localAdapter.getLinks(),
    ]);

    return (
      notes.length > 0 ||
      folders.length > 0 ||
      photos.length > 0 ||
      links.length > 0
    );
  } catch (error) {
    console.error("Failed to check LocalStorage data:", error);
    return false;
  }
}

/**
 * Migrate all data from LocalStorage to Firestore
 */
export async function migrateLocalStorageToFirestore(
  userId: string,
  onProgress?: (message: string) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    notesCount: 0,
    foldersCount: 0,
    photosCount: 0,
    linksCount: 0,
    errors: [],
  };

  const localAdapter = new LocalStorageAdapter();
  const firestoreAdapter = new FirestoreAdapter(userId);

  try {
    // Step 1: Migrate folders first (since notes/photos/links reference them)
    onProgress?.("Migrating folders...");
    const folders = await localAdapter.getFolders();

    for (const folder of folders) {
      try {
        await firestoreAdapter.createFolder({
          name: folder.name,
          color: folder.color,
          icon: folder.icon,
        });
        result.foldersCount++;
      } catch (error) {
        console.error(`Failed to migrate folder ${folder.id}:`, error);
        result.errors.push(`Folder "${folder.name}": ${error}`);
      }
    }

    // Step 2: Migrate notes
    onProgress?.("Migrating notes...");
    const notes = await localAdapter.getNotes();

    for (const note of notes) {
      try {
        await firestoreAdapter.createNote({
          title: note.title,
          content: note.content,
          contentType: note.contentType,
          tags: note.tags,
          folderId: note.folderId,
          isPinned: note.isPinned,
        });
        result.notesCount++;
      } catch (error) {
        console.error(`Failed to migrate note ${note.id}:`, error);
        result.errors.push(`Note "${note.title}": ${error}`);
      }
    }

    // Step 3: Migrate photos
    onProgress?.("Migrating photos...");
    const photos = await localAdapter.getPhotos();

    if (photos.length > 0) {
      try {
        await firestoreAdapter.savePhotos(photos);
        result.photosCount = photos.length;
      } catch (error) {
        console.error("Failed to migrate photos:", error);
        result.errors.push(`Photos migration failed: ${error}`);
      }
    }

    // Step 4: Migrate links
    onProgress?.("Migrating links...");
    const links = await localAdapter.getLinks();

    if (links.length > 0) {
      try {
        await firestoreAdapter.saveLinks(links);
        result.linksCount = links.length;
      } catch (error) {
        console.error("Failed to migrate links:", error);
        result.errors.push(`Links migration failed: ${error}`);
      }
    }

    // Mark migration as successful if no critical errors
    result.success = result.errors.length === 0;

    // Set migration flag in localStorage
    if (result.success) {
      localStorage.setItem(MIGRATION_FLAG_KEY, "true");
      onProgress?.("Migration completed successfully!");
    } else {
      onProgress?.(`Migration completed with ${result.errors.length} errors.`);
    }

    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    result.errors.push(`Critical error: ${error}`);
    return result;
  }
}

/**
 * Clear LocalStorage data after successful migration (optional)
 */
export function clearLocalStorageData(confirm: boolean = false): void {
  if (!confirm) {
    throw new Error(
      "Data clearing requires explicit confirmation to prevent accidental data loss"
    );
  }

  try {
    localStorage.removeItem("ooozzy_notes");
    localStorage.removeItem("ooozzy_folders");
    localStorage.removeItem("ooozzy_photos");
    localStorage.removeItem("ooozzy_links");
  } catch (error) {
    console.error("Failed to clear LocalStorage:", error);
    throw error;
  }
}

/**
 * Reset migration flag (for testing/debugging)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
}
