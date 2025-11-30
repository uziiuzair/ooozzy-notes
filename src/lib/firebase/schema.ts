import { collection, CollectionReference, Timestamp } from "firebase/firestore";
import { db } from "./firestore";

/**
 * Firestore Type Definitions
 */

export interface FirestoreUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreNote {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  content: string;
  contentType: "markdown" | "richtext";
  tags: string[];
  isPinned?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreFolder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestorePhoto {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  url: string; // Firebase Storage URL (not base64)
  thumbnailUrl?: string;
  caption?: string;
  tags: string[];
  isPinned?: boolean;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreLink {
  id: string;
  userId: string;
  folderId?: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  domain: string;
  isPinned: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Type-safe Collection References
 */

export const collections = {
  users: collection(db, "users") as CollectionReference<FirestoreUser>,
  notes: collection(db, "notes") as CollectionReference<FirestoreNote>,
  folders: collection(db, "folders") as CollectionReference<FirestoreFolder>,
  photos: collection(db, "photos") as CollectionReference<FirestorePhoto>,
  links: collection(db, "links") as CollectionReference<FirestoreLink>,
};

/**
 * Helper function to create user-scoped collection references
 */
export function getUserCollections(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
) {
  return {
    notes: collection(db, "notes") as CollectionReference<FirestoreNote>,
    folders: collection(db, "folders") as CollectionReference<FirestoreFolder>,
    photos: collection(db, "photos") as CollectionReference<FirestorePhoto>,
    links: collection(db, "links") as CollectionReference<FirestoreLink>,
  };
}
