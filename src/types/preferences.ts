export interface Preferences {
  defaultView: "grid" | "list";
  defaultEditor: "markdown" | "richtext";
  theme: "light" | "dark" | "system";
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
}

export const DEFAULT_PREFERENCES: Preferences = {
  defaultView: "grid",
  defaultEditor: "markdown",
  theme: "system",
  autoSave: true,
  autoSaveInterval: 1000, // 1 second
};
