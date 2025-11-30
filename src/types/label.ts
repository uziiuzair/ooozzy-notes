export interface Label {
  id: string;
  userId: string; // Owner of the label
  name: string; // Display name (e.g., "Work", "Personal")
  color?: string; // Hex color for visual distinction
  createdAt: string;
  updatedAt: string;
}

export type LabelInput = Omit<Label, "id" | "userId" | "createdAt" | "updatedAt">;
export type LabelUpdate = Partial<Omit<Label, "id" | "userId" | "createdAt">>;
