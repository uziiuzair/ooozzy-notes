import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { StorageAdapter } from "./types";
import { Note, NoteInput, NoteUpdate } from "@/types/note";
import { Folder, FolderInput, FolderUpdate } from "@/types/folder";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";

export class FirestoreAdapter implements StorageAdapter {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Helper methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  private timestampToString(timestamp: Timestamp | Date): string {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString();
    }
    return timestamp.toISOString();
  }

  // Notes operations
  async getNotes(): Promise<Note[]> {
    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", this.userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt),
        } as Note;
      });
    } catch (error) {
      console.error("Failed to get notes from Firestore:", error);
      throw new Error("Failed to load notes. Please try again.");
    }
  }

  async getNote(id: string): Promise<Note | null> {
    try {
      const docRef = doc(db, "notes", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Verify ownership
      if (data.userId !== this.userId) {
        return null;
      }

      return {
        ...data,
        id: docSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as Note;
    } catch (error) {
      console.error("Failed to get note from Firestore:", error);
      return null;
    }
  }

  async createNote(noteInput: NoteInput): Promise<Note> {
    try {
      const id = this.generateId();
      const docRef = doc(db, "notes", id);

      // Remove undefined fields (Firestore doesn't support undefined)
      const noteData: Record<string, unknown> = {
        userId: this.userId,
        title: noteInput.title,
        content: noteInput.content,
        contentType: noteInput.contentType,
        tags: noteInput.tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (noteInput.folderId !== undefined) {
        noteData.folderId = noteInput.folderId;
      }
      if (noteInput.isPinned !== undefined) {
        noteData.isPinned = noteInput.isPinned;
      }

      await setDoc(docRef, noteData);

      // Return the note with ISO string timestamps
      const now = new Date().toISOString();
      return {
        ...noteInput,
        id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Failed to create note in Firestore:", error);
      throw new Error("Failed to create note. Please try again.");
    }
  }

  async updateNote(id: string, updates: NoteUpdate): Promise<Note> {
    try {
      const docRef = doc(db, "notes", id);

      // Verify ownership before updating
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Note not found or access denied");
      }

      // Remove undefined fields (Firestore doesn't support undefined)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that are not undefined
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.contentType !== undefined)
        updateData.contentType = updates.contentType;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.folderId !== undefined) updateData.folderId = updates.folderId;
      if (updates.isPinned !== undefined) updateData.isPinned = updates.isPinned;

      await updateDoc(docRef, updateData);

      // Return updated note
      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data()!;

      return {
        ...data,
        id: updatedSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as Note;
    } catch (error) {
      console.error("Failed to update note in Firestore:", error);
      throw new Error("Failed to update note. Please try again.");
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const docRef = doc(db, "notes", id);

      // Verify ownership before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Note not found or access denied");
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete note from Firestore:", error);
      throw new Error("Failed to delete note. Please try again.");
    }
  }

  // Folders operations
  async getFolders(): Promise<Folder[]> {
    try {
      const q = query(
        collection(db, "folders"),
        where("userId", "==", this.userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt),
        } as Folder;
      });
    } catch (error) {
      console.error("Failed to get folders from Firestore:", error);
      throw new Error("Failed to load folders. Please try again.");
    }
  }

  async getFolder(id: string): Promise<Folder | null> {
    try {
      const docRef = doc(db, "folders", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Verify ownership
      if (data.userId !== this.userId) {
        return null;
      }

      return {
        ...data,
        id: docSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as Folder;
    } catch (error) {
      console.error("Failed to get folder from Firestore:", error);
      return null;
    }
  }

  async createFolder(folderInput: FolderInput): Promise<Folder> {
    try {
      const id = this.generateId();
      const docRef = doc(db, "folders", id);

      // Remove undefined fields (Firestore doesn't support undefined)
      const folderData: Record<string, unknown> = {
        userId: this.userId,
        name: folderInput.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (folderInput.color !== undefined) {
        folderData.color = folderInput.color;
      }
      if (folderInput.icon !== undefined) {
        folderData.icon = folderInput.icon;
      }

      await setDoc(docRef, folderData);

      // Return the folder with ISO string timestamps
      const now = new Date().toISOString();
      return {
        ...folderInput,
        id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Failed to create folder in Firestore:", error);
      throw new Error("Failed to create folder. Please try again.");
    }
  }

  async updateFolder(id: string, updates: FolderUpdate): Promise<Folder> {
    try {
      const docRef = doc(db, "folders", id);

      // Verify ownership before updating
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Folder not found or access denied");
      }

      // Remove undefined fields (Firestore doesn't support undefined)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that are not undefined
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.icon !== undefined) updateData.icon = updates.icon;

      await updateDoc(docRef, updateData);

      // Return updated folder
      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data()!;

      return {
        ...data,
        id: updatedSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as Folder;
    } catch (error) {
      console.error("Failed to update folder in Firestore:", error);
      throw new Error("Failed to update folder. Please try again.");
    }
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      const docRef = doc(db, "folders", id);

      // Verify ownership before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Folder not found or access denied");
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete folder from Firestore:", error);
      throw new Error("Failed to delete folder. Please try again.");
    }
  }

  // Search operations
  async searchNotes(query: string): Promise<Note[]> {
    // Note: Firestore doesn't have full-text search built-in
    // For MVP, we'll fetch all notes and filter client-side
    // For production, consider using Algolia or Firestore vector search
    const notes = await this.getNotes();
    const lowerQuery = query.toLowerCase();

    return notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(lowerQuery);
      const contentMatch = note.content.toLowerCase().includes(lowerQuery);
      const tagMatch = note.tags.some((tag) =>
        tag.toLowerCase().includes(lowerQuery)
      );

      return titleMatch || contentMatch || tagMatch;
    });
  }

  async getNotesByFolder(folderId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", this.userId),
        where("folderId", "==", folderId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt),
        } as Note;
      });
    } catch (error) {
      console.error("Failed to get notes by folder from Firestore:", error);
      return [];
    }
  }

  async getNotesByTags(tags: string[]): Promise<Note[]> {
    // Firestore doesn't support array-contains-any with multiple values efficiently
    // Fetch all notes and filter client-side
    const notes = await this.getNotes();
    const lowerTags = tags.map((tag) => tag.toLowerCase());

    return notes.filter((note) =>
      note.tags.some((noteTag) => lowerTags.includes(noteTag.toLowerCase()))
    );
  }

  // Bulk operations
  async deleteNotesByFolder(folderId: string): Promise<void> {
    try {
      const notes = await this.getNotesByFolder(folderId);

      // Delete each note
      const deletePromises = notes.map((note) => this.deleteNote(note.id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Failed to delete notes by folder from Firestore:", error);
      throw new Error("Failed to delete notes. Please try again.");
    }
  }

  // Photos operations
  async getPhotos(): Promise<Photo[]> {
    try {
      const q = query(
        collection(db, "photos"),
        where("userId", "==", this.userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: this.timestampToString(data.createdAt),
          updatedAt: this.timestampToString(data.updatedAt),
        } as Photo;
      });
    } catch (error) {
      console.error("Failed to get photos from Firestore:", error);
      return [];
    }
  }

  async savePhotos(photos: Photo[]): Promise<void> {
    try {
      // Note: This is a simplified implementation matching LocalStorage adapter
      // For production, implement individual photo CRUD operations
      const savePromises = photos.map(async (photo) => {
        const docRef = doc(db, "photos", photo.id);
        await setDoc(docRef, {
          ...photo,
          userId: this.userId,
          createdAt: photo.createdAt
            ? Timestamp.fromDate(new Date(photo.createdAt))
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error("Failed to save photos to Firestore:", error);
      throw new Error("Failed to save photos. Please try again.");
    }
  }

  async deletePhotosByFolder(folderId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "photos"),
        where("userId", "==", this.userId),
        where("folderId", "==", folderId)
      );
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Failed to delete photos by folder from Firestore:", error);
      throw new Error("Failed to delete photos. Please try again.");
    }
  }

  // Links operations
  async getLinks(): Promise<Link[]> {
    try {
      const q = query(
        collection(db, "links"),
        where("userId", "==", this.userId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          title: data.title,
          description: data.description,
          favicon: data.favicon,
          image: data.image,
          domain: data.domain,
          isPinned: data.isPinned,
          folderId: data.folderId,
          createdAt: new Date(this.timestampToString(data.createdAt)),
          updatedAt: new Date(this.timestampToString(data.updatedAt)),
        };
      });
    } catch (error) {
      console.error("Failed to get links from Firestore:", error);
      return [];
    }
  }

  async saveLinks(links: Link[]): Promise<void> {
    try {
      // Note: This is a simplified implementation matching LocalStorage adapter
      // For production, implement individual link CRUD operations
      const savePromises = links.map(async (link) => {
        const docRef = doc(db, "links", link.id);
        await setDoc(docRef, {
          ...link,
          userId: this.userId,
          createdAt:
            link.createdAt instanceof Date
              ? Timestamp.fromDate(link.createdAt)
              : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error("Failed to save links to Firestore:", error);
      throw new Error("Failed to save links. Please try again.");
    }
  }

  async deleteLinksByFolder(folderId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "links"),
        where("userId", "==", this.userId),
        where("folderId", "==", folderId)
      );
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Failed to delete links by folder from Firestore:", error);
      throw new Error("Failed to delete links. Please try again.");
    }
  }
}
