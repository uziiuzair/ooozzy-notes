export interface Note {
  id: string;
  folderId?: string;
  title: string;
  content: string;
  contentType: "markdown" | "richtext";
  tags: string[];
  labelIds?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;
export type NoteUpdate = Partial<Omit<Note, "id" | "createdAt">>;
