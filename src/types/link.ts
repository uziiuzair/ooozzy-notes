export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  folderId?: string;
}

export interface LinkMetadata {
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  domain: string;
}
