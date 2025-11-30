import { Note, NoteInput, NoteUpdate } from "@/types/note";
import { Folder, FolderInput, FolderUpdate } from "@/types/folder";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";
import { Label, LabelInput, LabelUpdate } from "@/types/label";

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
  deletePhoto(id: string): Promise<void>;
  updatePhoto(id: string, updates: Partial<Photo>): Promise<void>;

  // Links operations
  getLinks(): Promise<Link[]>;
  saveLinks(links: Link[]): Promise<void>;
  deleteLink(id: string): Promise<void>;
  updateLink(id: string, updates: Partial<Link>): Promise<void>;

  // Search operations
  searchNotes(query: string): Promise<Note[]>;
  getNotesByFolder(folderId: string): Promise<Note[]>;
  getNotesByTags(tags: string[]): Promise<Note[]>;

  // Bulk operations
  deleteNotesByFolder(folderId: string): Promise<void>;

  // Labels operations
  getLabels(): Promise<Label[]>;
  getLabel(id: string): Promise<Label | null>;
  createLabel(label: LabelInput): Promise<Label>;
  updateLabel(id: string, updates: LabelUpdate): Promise<Label>;
  deleteLabel(id: string): Promise<void>;
}
