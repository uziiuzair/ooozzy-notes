import { useCallback, useState } from "react";
import { useNotesContext } from "@/providers/NotesProvider";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { NoteInput, NoteUpdate } from "@/types/note";

export const useNotes = () => {
  const { user } = useAuth();
  const { notes, setNotes, loading, error, refreshNotes } = useNotesContext();
  const [isOperating, setIsOperating] = useState(false);

  const createNote = useCallback(
    async (noteInput: Partial<NoteInput> = {}) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        const newNote = await adapter.createNote({
          title: noteInput.title || "",
          content: noteInput.content || "",
          contentType: noteInput.contentType || "markdown",
          tags: noteInput.tags || [],
          folderId: noteInput.folderId,
          isPinned: noteInput.isPinned || false,
        });

        setNotes((prev) => [...prev, newNote]);
        return newNote;
      } catch (error) {
        console.error("Failed to create note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user]
  );

  const updateNote = useCallback(
    async (id: string, updates: NoteUpdate) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        const updatedNote = await adapter.updateNote(id, updates);
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updatedNote : note))
        );
        return updatedNote;
      } catch (error) {
        console.error("Failed to update note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        await adapter.deleteNote(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
      } catch (error) {
        console.error("Failed to delete note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user]
  );

  const searchNotes = useCallback(
    async (query: string) => {
      try {
        if (!query.trim()) {
          return notes;
        }
        const adapter = getStorageAdapter(user?.uid);
        return await adapter.searchNotes(query);
      } catch (error) {
        console.error("Failed to search notes:", error);
        return [];
      }
    },
    [notes, user]
  );

  const getNotesByFolder = useCallback(async (folderId: string) => {
    try {
      const adapter = getStorageAdapter(user?.uid);
      return await adapter.getNotesByFolder(folderId);
    } catch (error) {
      console.error("Failed to get notes by folder:", error);
      return [];
    }
  }, [user]);

  const getNotesByTags = useCallback(async (tags: string[]) => {
    try {
      const adapter = getStorageAdapter(user?.uid);
      return await adapter.getNotesByTags(tags);
    } catch (error) {
      console.error("Failed to get notes by tags:", error);
      return [];
    }
  }, [user]);

  const togglePinNote = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (note) {
        return updateNote(id, { isPinned: !note.isPinned });
      }
    },
    [notes, updateNote]
  );

  return {
    notes,
    loading,
    error,
    isOperating,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNotesByFolder,
    getNotesByTags,
    togglePinNote,
    refreshNotes,
  };
};
