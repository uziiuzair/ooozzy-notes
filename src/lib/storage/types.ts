import { Note, NoteInput, NoteUpdate } from "@/types/note";
import { Folder, FolderInput, FolderUpdate } from "@/types/folder";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";

export interface StorageAdapter {
  // Notes operations
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  createNote(note: NoteInput): Promise<Note>;
  updateNote(id: string, updates: NoteUpdate): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Folders operations
  getFolders(): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | null>;
  createFolder(folder: FolderInput): Promise<Folder>;
  updateFolder(id: string, updates: FolderUpdate): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  // Photos operations
  getPhotos(): Promise<Photo[]>;
  savePhotos(photos: Photo[]): Promise<void>;

  // Links operations
  getLinks(): Promise<Link[]>;
  saveLinks(links: Link[]): Promise<void>;

  // Search operations
  searchNotes(query: string): Promise<Note[]>;
  getNotesByFolder(folderId: string): Promise<Note[]>;
  getNotesByTags(tags: string[]): Promise<Note[]>;

  // Bulk operations
  deleteNotesByFolder(folderId: string): Promise<void>;
}
