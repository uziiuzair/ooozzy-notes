export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  labelIds?: string[]; // References to label IDs
  createdAt: string;
  updatedAt: string;
}

export type FolderInput = Omit<Folder, "id" | "createdAt" | "updatedAt">;
export type FolderUpdate = Partial<Omit<Folder, "id" | "createdAt">>;
