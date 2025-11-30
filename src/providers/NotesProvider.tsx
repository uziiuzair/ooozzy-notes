"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  FC,
  useContext,
} from "react";
import { Note } from "@/types/note";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { FolderSuggestionModal } from "@/components/molecules/FolderSuggestionModal";

interface FolderSuggestion {
  noteId: string;
  folderName: string;
  folderId: string;
}

interface NotesContextType {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  loading: boolean;
  error: string | null;
  refreshNotes: () => Promise<void>;
  setFolderSuggestion: (suggestion: FolderSuggestion | null) => void;
}

export const NotesContext = createContext<NotesContextType>({
  notes: [],
  setNotes: () => {},
  loading: true,
  error: null,
  refreshNotes: async () => {},
  setFolderSuggestion: () => {},
});

export const useNotesContext = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within NotesProvider");
  }
  return context;
};

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: FC<NotesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderSuggestion, setFolderSuggestion] = useState<FolderSuggestion | null>(null);

  const refreshNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const adapter = getStorageAdapter(user?.uid);
      const loadedNotes = await adapter.getNotes();
      setNotes(loadedNotes);
    } catch (err) {
      console.error("Failed to load notes:", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load notes on mount and when auth state changes
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const handleMoveToFolder = useCallback(async () => {
    if (!folderSuggestion) return;

    const adapter = getStorageAdapter(user?.uid);
    await adapter.updateNote(folderSuggestion.noteId, {
      folderId: folderSuggestion.folderId,
    });
    setNotes((prev) =>
      prev.map((note) =>
        note.id === folderSuggestion.noteId
          ? { ...note, folderId: folderSuggestion.folderId }
          : note
      )
    );
  }, [folderSuggestion, user]);

  return (
    <NotesContext.Provider
      value={{ notes, setNotes, loading, error, refreshNotes, setFolderSuggestion }}
    >
      {children}
      <FolderSuggestionModal
        isOpen={!!folderSuggestion}
        folderName={folderSuggestion?.folderName || ""}
        onMove={handleMoveToFolder}
        onDismiss={() => setFolderSuggestion(null)}
      />
    </NotesContext.Provider>
  );
};
