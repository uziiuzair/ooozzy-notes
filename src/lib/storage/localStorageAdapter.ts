import { StorageAdapter } from "./types";
import { Note, NoteInput, NoteUpdate } from "@/types/note";
import { Folder, FolderInput, FolderUpdate } from "@/types/folder";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";

export class LocalStorageAdapter implements StorageAdapter {
  private readonly NOTES_KEY = "ooozzy_notes";
  private readonly FOLDERS_KEY = "ooozzy_folders";
  private readonly PHOTOS_KEY = "ooozzy_photos";
  private readonly LINKS_KEY = "ooozzy_links";

  // Helper methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Notes operations
  async getNotes(): Promise<Note[]> {
    try {
      const stored = localStorage.getItem(this.NOTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get notes from localStorage:", error);
      return [];
    }
  }

  async getNote(id: string): Promise<Note | null> {
    const notes = await this.getNotes();
    return notes.find((note) => note.id === id) || null;
  }

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

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter((note) => note.id !== id);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
  }

  // Folders operations
  async getFolders(): Promise<Folder[]> {
    try {
      const stored = localStorage.getItem(this.FOLDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get folders from localStorage:", error);
      return [];
    }
  }

  async getFolder(id: string): Promise<Folder | null> {
    const folders = await this.getFolders();
    return folders.find((folder) => folder.id === id) || null;
  }

  async createFolder(folderInput: FolderInput): Promise<Folder> {
    const folders = await this.getFolders();
    const newFolder: Folder = {
      ...folderInput,
      id: this.generateId(),
      createdAt: this.getCurrentTimestamp(),
      updatedAt: this.getCurrentTimestamp(),
    };

    folders.push(newFolder);
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
    return newFolder;
  }

  async updateFolder(id: string, updates: FolderUpdate): Promise<Folder> {
    const folders = await this.getFolders();
    const folderIndex = folders.findIndex((folder) => folder.id === id);

    if (folderIndex === -1) {
      throw new Error(`Folder with id ${id} not found`);
    }

    const updatedFolder: Folder = {
      ...folders[folderIndex],
      ...updates,
      updatedAt: this.getCurrentTimestamp(),
    };

    folders[folderIndex] = updatedFolder;
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<void> {
    const folders = await this.getFolders();
    const filteredFolders = folders.filter((folder) => folder.id !== id);
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(filteredFolders));
  }

  // Search operations
  async searchNotes(query: string): Promise<Note[]> {
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
    const notes = await this.getNotes();
    return notes.filter((note) => note.folderId === folderId);
  }

  async getNotesByTags(tags: string[]): Promise<Note[]> {
    const notes = await this.getNotes();
    const lowerTags = tags.map((tag) => tag.toLowerCase());

    return notes.filter((note) =>
      note.tags.some((noteTag) => lowerTags.includes(noteTag.toLowerCase()))
    );
  }

  // Bulk operations
  async deleteNotesByFolder(folderId: string): Promise<void> {
    const notes = await this.getNotes();
    const filteredNotes = notes.filter((note) => note.folderId !== folderId);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
  }

  // Photos operations
  async getPhotos(): Promise<Photo[]> {
    try {
      const stored = localStorage.getItem(this.PHOTOS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get photos from localStorage:", error);
      return [];
    }
  }

  async savePhotos(photos: Photo[]): Promise<void> {
    try {
      localStorage.setItem(this.PHOTOS_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error("Failed to save photos to localStorage:", error);
      throw error;
    }
  }

  async deletePhotosByFolder(folderId: string): Promise<void> {
    const photos = await this.getPhotos();
    const filteredPhotos = photos.filter(
      (photo) => photo.folderId !== folderId
    );
    await this.savePhotos(filteredPhotos);
  }

  // Links operations
  async getLinks(): Promise<Link[]> {
    try {
      const stored = localStorage.getItem(this.LINKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to get links from localStorage:", error);
      return [];
    }
  }

  async saveLinks(links: Link[]): Promise<void> {
    try {
      localStorage.setItem(this.LINKS_KEY, JSON.stringify(links));
    } catch (error) {
      console.error("Failed to save links to localStorage:", error);
      throw error;
    }
  }

  async deleteLinksByFolder(folderId: string): Promise<void> {
    const links = await this.getLinks();
    const filteredLinks = links.filter((link) => link.folderId !== folderId);
    await this.saveLinks(filteredLinks);
  }
}
