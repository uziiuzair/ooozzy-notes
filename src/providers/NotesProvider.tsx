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

interface NotesContextType {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  loading: boolean;
  error: string | null;
  refreshNotes: () => Promise<void>;
}

export const NotesContext = createContext<NotesContextType>({
  notes: [],
  setNotes: () => {},
  loading: true,
  error: null,
  refreshNotes: async () => {},
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

  return (
    <NotesContext.Provider
      value={{ notes, setNotes, loading, error, refreshNotes }}
    >
      {children}
    </NotesContext.Provider>
  );
};
