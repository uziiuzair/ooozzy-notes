import { LocalStorageAdapter } from "./localStorageAdapter";
import { FirestoreAdapter } from "./firestoreAdapter";
import { StorageAdapter } from "./types";

/**
 * Get storage adapter based on user authentication state
 *
 * @param userId - Optional user ID for authenticated users
 * @returns StorageAdapter instance
 *
 * @example
 * // Unauthenticated (uses LocalStorage)
 * const adapter = getStorageAdapter();
 *
 * @example
 * // Authenticated (uses Firestore)
 * const adapter = getStorageAdapter(user.uid);
 */
export function getStorageAdapter(userId?: string | null): StorageAdapter {
  if (userId) {
    return new FirestoreAdapter(userId);
  }
  return new LocalStorageAdapter();
}

// Legacy export for backward compatibility
export const storage = new LocalStorageAdapter();
export const storageAdapter = storage;
