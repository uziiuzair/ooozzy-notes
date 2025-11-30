import { useCallback, useState } from "react";
import { useNotesContext } from "@/providers/NotesProvider";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { NoteInput, NoteUpdate } from "@/types/note";
import { useEvents } from "@/hooks/useEvents";
import { useLabels } from "@/hooks/useLabels";
import { useFolders } from "@/hooks/useFolders";
import { classifyContent } from "@/lib/ai/labelClassifier";

export const useNotes = () => {
  const { user } = useAuth();
  const { notes, setNotes, loading, error, refreshNotes, setFolderSuggestion } = useNotesContext();
  const [isOperating, setIsOperating] = useState(false);
  const { emit } = useEvents();
  const { labels, createLabel } = useLabels();
  const { folders } = useFolders();

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
          labelIds: noteInput.labelIds,
          isPinned: noteInput.isPinned || false,
        });

        setNotes((prev) => [...prev, newNote]);

        // Emit event
        emit("note:created", {
          noteId: newNote.id,
          folderId: newNote.folderId || null,
          title: newNote.title,
          timestamp: Date.now(),
        });

        // AI label classification (async, non-blocking)
        if (user && !noteInput.labelIds) {
          classifyContent({
            content: newNote.content,
            title: newNote.title,
            type: "note",
            existingLabels: labels,
          })
            .then(async (result) => {
              if (result.suggestedLabelIds.length === 0 && result.newLabels.length === 0) {
                return; // No suggestions
              }

              // Create new labels first
              const createdLabelIds: string[] = [];
              for (const newLabelInput of result.newLabels) {
                try {
                  const createdLabel = await createLabel(newLabelInput);
                  createdLabelIds.push(createdLabel.id);
                } catch (err) {
                  console.error("Failed to create suggested label:", err);
                }
              }

              const allSuggestedLabelIds = [...result.suggestedLabelIds, ...createdLabelIds];
              if (allSuggestedLabelIds.length === 0) return;

              // Auto-apply labels immediately
              try {
                await adapter.updateNote(newNote.id, { labelIds: allSuggestedLabelIds });
                setNotes((prev) =>
                  prev.map((note) =>
                    note.id === newNote.id ? { ...note, labelIds: allSuggestedLabelIds } : note
                  )
                );

                // Check for folder suggestions
                const matchingFolder = folders.find(f =>
                  f.labelIds?.some(id => allSuggestedLabelIds.includes(id))
                );
                if (matchingFolder && !newNote.folderId) {
                  setFolderSuggestion({
                    noteId: newNote.id,
                    folderName: matchingFolder.name,
                    folderId: matchingFolder.id,
                  });
                }
              } catch (err) {
                console.error("Failed to auto-apply labels:", err);
              }
            })
            .catch((err) => {
              console.error("AI classification failed:", err);
            });
        }

        return newNote;
      } catch (error) {
        console.error("Failed to create note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user, emit, labels, createLabel, folders, setFolderSuggestion]
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

        // Emit event
        emit("note:updated", {
          noteId: id,
          folderId: updatedNote.folderId || null,
          fieldsUpdated: Object.keys(updates),
          timestamp: Date.now(),
        });

        return updatedNote;
      } catch (error) {
        console.error("Failed to update note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user, emit]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        setIsOperating(true);
        // Get note before deleting to capture folderId
        const note = notes.find((n) => n.id === id);
        const adapter = getStorageAdapter(user?.uid);
        await adapter.deleteNote(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));

        // Emit event
        emit("note:deleted", {
          noteId: id,
          folderId: note?.folderId || null,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to delete note:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setNotes, user, notes, emit]
  );

  const searchNotes = useCallback(
    async (query: string) => {
      try {
        if (!query.trim()) {
          return notes;
        }
        const adapter = getStorageAdapter(user?.uid);
        const results = await adapter.searchNotes(query);

        // Emit search event
        emit("search:performed", {
          query,
          resultsCount: results.length,
          timestamp: Date.now(),
        });

        return results;
      } catch (error) {
        console.error("Failed to search notes:", error);
        return [];
      }
    },
    [notes, user, emit]
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
