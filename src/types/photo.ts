export interface Photo {
  id: string;
  folderId?: string;
  title: string;
  url: string; // URL or base64 data URL of the photo
  thumbnailUrl?: string; // Optional thumbnail for performance
  caption?: string;
  tags: string[];
  isPinned?: boolean;
  width?: number;
  height?: number;
  size?: number; // File size in bytes
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

export type PhotoInput = Omit<Photo, "id" | "createdAt" | "updatedAt">;
export type PhotoUpdate = Partial<Omit<Photo, "id" | "createdAt">>;
