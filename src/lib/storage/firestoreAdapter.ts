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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "@/lib/firebase/firestore";
import { storage } from "@/lib/firebase/storage";
import { StorageAdapter } from "./types";
import { Note, NoteInput, NoteUpdate } from "@/types/note";
import { Folder, FolderInput, FolderUpdate } from "@/types/folder";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";
import { Label, LabelInput, LabelUpdate } from "@/types/label";
import { File, FileInput, FileUpdate } from "@/types/file";

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
      if (noteInput.labelIds !== undefined) {
        noteData.labelIds = noteInput.labelIds;
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
      if (updates.folderId !== undefined)
        updateData.folderId = updates.folderId;
      if (updates.labelIds !== undefined)
        updateData.labelIds = updates.labelIds;
      if (updates.isPinned !== undefined)
        updateData.isPinned = updates.isPinned;

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
      if (folderInput.parentId !== undefined) {
        folderData.parentId = folderInput.parentId;
      }
      if (folderInput.color !== undefined) {
        folderData.color = folderInput.color;
      }
      if (folderInput.icon !== undefined) {
        folderData.icon = folderInput.icon;
      }
      if (folderInput.labelIds !== undefined) {
        folderData.labelIds = folderInput.labelIds;
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
      if (updates.parentId !== undefined)
        updateData.parentId = updates.parentId;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.labelIds !== undefined)
        updateData.labelIds = updates.labelIds;

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

        // Build photo data without undefined fields
        const photoData: Record<string, unknown> = {
          title: photo.title,
          url: photo.url,
          tags: photo.tags || [],
          userId: this.userId,
          createdAt: photo.createdAt
            ? Timestamp.fromDate(new Date(photo.createdAt))
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Add optional fields only if they have values
        if (photo.folderId !== undefined) photoData.folderId = photo.folderId;
        if (photo.labelIds !== undefined) photoData.labelIds = photo.labelIds;
        if (photo.thumbnailUrl !== undefined)
          photoData.thumbnailUrl = photo.thumbnailUrl;
        if (photo.caption !== undefined) photoData.caption = photo.caption;
        if (photo.isPinned !== undefined) photoData.isPinned = photo.isPinned;
        if (photo.width !== undefined) photoData.width = photo.width;
        if (photo.height !== undefined) photoData.height = photo.height;
        if (photo.size !== undefined) photoData.size = photo.size;
        if (photo.mimeType !== undefined) photoData.mimeType = photo.mimeType;

        await setDoc(docRef, photoData);
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error("Failed to save photos to Firestore:", error);
      throw new Error("Failed to save photos. Please try again.");
    }
  }

  async deletePhoto(id: string): Promise<void> {
    try {
      const docRef = doc(db, "photos", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete photo from Firestore:", error);
      throw new Error("Failed to delete photo. Please try again.");
    }
  }

  async updatePhoto(id: string, updates: Partial<Photo>): Promise<void> {
    try {
      const docRef = doc(db, "photos", id);

      // Build update data without undefined fields
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Add optional fields only if they have values
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.thumbnailUrl !== undefined)
        updateData.thumbnailUrl = updates.thumbnailUrl;
      if (updates.caption !== undefined) updateData.caption = updates.caption;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.labelIds !== undefined)
        updateData.labelIds = updates.labelIds;
      if (updates.isPinned !== undefined)
        updateData.isPinned = updates.isPinned;
      if (updates.folderId !== undefined)
        updateData.folderId = updates.folderId;
      if (updates.width !== undefined) updateData.width = updates.width;
      if (updates.height !== undefined) updateData.height = updates.height;
      if (updates.size !== undefined) updateData.size = updates.size;
      if (updates.mimeType !== undefined)
        updateData.mimeType = updates.mimeType;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Failed to update photo in Firestore:", error);
      throw new Error("Failed to update photo. Please try again.");
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
          labelIds: data.labelIds,
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

        // Build link data without undefined fields
        const linkData: Record<string, unknown> = {
          url: link.url,
          title: link.title,
          domain: link.domain,
          isPinned: link.isPinned,
          userId: this.userId,
          createdAt:
            link.createdAt instanceof Date
              ? Timestamp.fromDate(link.createdAt)
              : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Add optional fields only if they have values
        if (link.description !== undefined)
          linkData.description = link.description;
        if (link.favicon !== undefined) linkData.favicon = link.favicon;
        if (link.image !== undefined) linkData.image = link.image;
        if (link.labelIds !== undefined) linkData.labelIds = link.labelIds;
        if (link.folderId !== undefined) linkData.folderId = link.folderId;

        await setDoc(docRef, linkData);
      });

      await Promise.all(savePromises);
    } catch (error) {
      console.error("Failed to save links to Firestore:", error);
      throw new Error("Failed to save links. Please try again.");
    }
  }

  async deleteLink(id: string): Promise<void> {
    try {
      const docRef = doc(db, "links", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete link from Firestore:", error);
      throw new Error("Failed to delete link. Please try again.");
    }
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<void> {
    try {
      const docRef = doc(db, "links", id);

      // Build update data without undefined fields
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Add optional fields only if they have values
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.favicon !== undefined) updateData.favicon = updates.favicon;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.domain !== undefined) updateData.domain = updates.domain;
      if (updates.labelIds !== undefined)
        updateData.labelIds = updates.labelIds;
      if (updates.isPinned !== undefined)
        updateData.isPinned = updates.isPinned;
      if (updates.folderId !== undefined)
        updateData.folderId = updates.folderId;

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Failed to update link in Firestore:", error);
      throw new Error("Failed to update link. Please try again.");
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

  // Labels operations
  async getLabels(): Promise<Label[]> {
    try {
      const q = query(
        collection(db, "labels"),
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
        } as Label;
      });
    } catch (error) {
      console.error("Failed to get labels from Firestore:", error);
      throw new Error("Failed to load labels. Please try again.");
    }
  }

  async getLabel(id: string): Promise<Label | null> {
    try {
      const docRef = doc(db, "labels", id);
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
      } as Label;
    } catch (error) {
      console.error("Failed to get label from Firestore:", error);
      return null;
    }
  }

  async createLabel(labelInput: LabelInput): Promise<Label> {
    try {
      const id = this.generateId();
      const docRef = doc(db, "labels", id);

      // Remove undefined fields (Firestore doesn't support undefined)
      const labelData: Record<string, unknown> = {
        userId: this.userId,
        name: labelInput.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (labelInput.color !== undefined) {
        labelData.color = labelInput.color;
      }

      await setDoc(docRef, labelData);

      // Return the label with ISO string timestamps
      const now = new Date().toISOString();
      return {
        ...labelInput,
        id,
        userId: this.userId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Failed to create label in Firestore:", error);
      throw new Error("Failed to create label. Please try again.");
    }
  }

  async updateLabel(id: string, updates: LabelUpdate): Promise<Label> {
    try {
      const docRef = doc(db, "labels", id);

      // Verify ownership before updating
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Label not found or access denied");
      }

      // Remove undefined fields (Firestore doesn't support undefined)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that are not undefined
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;

      await updateDoc(docRef, updateData);

      // Return updated label
      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data()!;

      return {
        ...data,
        id: updatedSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as Label;
    } catch (error) {
      console.error("Failed to update label in Firestore:", error);
      throw new Error("Failed to update label. Please try again.");
    }
  }

  async deleteLabel(id: string): Promise<void> {
    try {
      const docRef = doc(db, "labels", id);

      // Verify ownership before deleting
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("Label not found or access denied");
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete label from Firestore:", error);
      throw new Error("Failed to delete label. Please try again.");
    }
  }

  // Files operations
  async getFiles(): Promise<File[]> {
    try {
      const q = query(
        collection(db, "files"),
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
        } as File;
      });
    } catch (error) {
      console.error("Failed to fetch files from Firestore:", error);
      throw new Error("Failed to fetch files. Please try again.");
    }
  }

  async uploadFile(file: globalThis.File, metadata: FileInput): Promise<File> {
    try {
      console.log("🔵 [uploadFile] Starting upload", {
        fileName: file.name,
        fileSize: file.size,
        userId: this.userId,
      });

      const fileId = this.generateId();
      const fileExtension = file.name.split(".").pop() || "";
      const storagePath = `files/${this.userId}/${fileId}.${fileExtension}`;
      console.log("🔵 [uploadFile] Storage path:", storagePath);

      // Upload file to Firebase Storage
      const storageRef = ref(storage, storagePath);
      console.log("🔵 [uploadFile] Uploading to Storage...");
      await uploadBytes(storageRef, file);
      console.log("✅ [uploadFile] Upload to Storage successful");

      // Get download URL
      console.log("🔵 [uploadFile] Getting download URL...");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("✅ [uploadFile] Download URL obtained:", downloadURL);

      // Create file document in Firestore
      // Filter out undefined values (Firestore doesn't allow undefined)
      const rawFileData = {
        ...metadata,
        url: downloadURL,
        storagePath,
        userId: this.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove undefined fields
      const fileData = Object.fromEntries(
        Object.entries(rawFileData).filter(([, value]) => value !== undefined)
      );

      console.log("🔵 [uploadFile] Creating Firestore document...", {
        fileId,
        fileData: {
          ...fileData,
          createdAt: "serverTimestamp()",
          updatedAt: "serverTimestamp()",
        },
      });

      const docRef = doc(db, "files", fileId);
      await setDoc(docRef, fileData);
      console.log("✅ [uploadFile] Firestore document created successfully");

      // Return file object with timestamps
      const result = {
        id: fileId,
        ...metadata,
        url: downloadURL,
        storagePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log(
        "✅ [uploadFile] Upload complete, returning file object:",
        result
      );
      return result;
    } catch (error) {
      console.error("❌ [uploadFile] Upload failed:", error);
      console.error("❌ [uploadFile] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error("Failed to upload file. Please try again.");
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      const docRef = doc(db, "files", id);

      // Get file data to retrieve storage path
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("File not found or access denied");
      }

      const fileData = docSnap.data();
      const storagePath = fileData.storagePath;

      // Delete from Firebase Storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw new Error("Failed to delete file. Please try again.");
    }
  }

  async updateFile(id: string, updates: FileUpdate): Promise<File> {
    try {
      const docRef = doc(db, "files", id);

      // Verify ownership before updating
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().userId !== this.userId) {
        throw new Error("File not found or access denied");
      }

      // Remove undefined fields (Firestore doesn't support undefined)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      // Only add fields that are not undefined
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.folderId !== undefined)
        updateData.folderId = updates.folderId;
      if (updates.labelIds !== undefined)
        updateData.labelIds = updates.labelIds;
      if (updates.isPinned !== undefined)
        updateData.isPinned = updates.isPinned;

      await updateDoc(docRef, updateData);

      // Return updated file
      const updatedSnap = await getDoc(docRef);
      const data = updatedSnap.data()!;

      return {
        ...data,
        id: updatedSnap.id,
        createdAt: this.timestampToString(data.createdAt),
        updatedAt: this.timestampToString(data.updatedAt),
      } as File;
    } catch (error) {
      console.error("Failed to update file in Firestore:", error);
      throw new Error("Failed to update file. Please try again.");
    }
  }
}
