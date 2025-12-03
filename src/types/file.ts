export interface File {
  id: string;
  folderId?: string; // Reference to parent folder for organization
  name: string;
  url: string; // Firebase Storage download URL
  storagePath: string; // Firebase Storage path (for deletion)
  mimeType: string;
  size: number; // File size in bytes
  fileType: "document" | "video" | "audio" | "archive" | "other";
  thumbnailUrl?: string; // Optional thumbnail for videos (future enhancement)
  labelIds?: string[]; // References to label IDs
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FileInput = Omit<File, "id" | "createdAt" | "updatedAt">;
export type FileUpdate = Partial<Omit<File, "id" | "createdAt">>;
