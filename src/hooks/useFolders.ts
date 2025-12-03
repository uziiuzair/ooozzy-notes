import { useCallback, useState } from "react";
import { useFoldersContext } from "@/providers/FoldersProvider";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { FolderInput, FolderUpdate } from "@/types/folder";
import { useEvents } from "@/hooks/useEvents";

export const useFolders = () => {
  const { user } = useAuth();
  const { folders, setFolders, loading, error, refreshFolders } =
    useFoldersContext();
  const [isOperating, setIsOperating] = useState(false);
  const { emit } = useEvents();

  const createFolder = useCallback(
    async (folderInput: Partial<FolderInput> = {}) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      // Create optimistic folder
      const optimisticFolder = {
        id: tempId,
        name: folderInput.name || "New Folder",
        color: folderInput.color,
        icon: folderInput.icon,
        parentId: folderInput.parentId,
        createdAt: now,
        updatedAt: now,
      };

      // Add optimistic folder to state immediately
      setFolders((prev) => [...prev, optimisticFolder]);

      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        const newFolder = await adapter.createFolder({
          name: folderInput.name || "New Folder",
          color: folderInput.color,
          icon: folderInput.icon,
          parentId: folderInput.parentId,
        });

        // Replace optimistic folder with real one from DB
        setFolders((prev) =>
          prev.map((folder) => (folder.id === tempId ? newFolder : folder))
        );

        // Emit event
        emit("folder:created", {
          folderId: newFolder.id,
          name: newFolder.name,
          timestamp: Date.now(),
        });

        return newFolder;
      } catch (error) {
        console.error("Failed to create folder:", error);
        // Rollback optimistic update on error
        setFolders((prev) => prev.filter((folder) => folder.id !== tempId));
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setFolders, user, emit]
  );

  const updateFolder = useCallback(
    async (id: string, updates: FolderUpdate) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        const updatedFolder = await adapter.updateFolder(id, updates);
        setFolders((prev) =>
          prev.map((folder) => (folder.id === id ? updatedFolder : folder))
        );

        // Emit event
        emit("folder:updated", {
          folderId: id,
          fieldsUpdated: Object.keys(updates),
          timestamp: Date.now(),
        });

        return updatedFolder;
      } catch (error) {
        console.error("Failed to update folder:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setFolders, user, emit]
  );

  const deleteFolder = useCallback(
    async (id: string, deleteNotes: boolean = false) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);

        // Recursively collect all descendant folder IDs
        const getAllDescendantIds = (folderId: string): string[] => {
          const children = folders.filter((f) => f.parentId === folderId);
          const descendants = children.map((child) => child.id);
          // Recursively get descendants of each child
          children.forEach((child) => {
            descendants.push(...getAllDescendantIds(child.id));
          });
          return descendants;
        };

        const descendantIds = getAllDescendantIds(id);
        const allFolderIds = [id, ...descendantIds];

        // Get total note count before deletion for event
        let noteCount = 0;
        if (deleteNotes) {
          for (const folderId of allFolderIds) {
            const notes = await adapter.getNotesByFolder(folderId);
            noteCount += notes.length;
            await adapter.deleteNotesByFolder(folderId);
          }
        }

        // Delete all folders (children first, then parent)
        for (const folderId of [...descendantIds].reverse()) {
          await adapter.deleteFolder(folderId);
        }
        await adapter.deleteFolder(id);

        // Remove all deleted folders from state
        setFolders((prev) =>
          prev.filter((folder) => !allFolderIds.includes(folder.id))
        );

        // Emit event
        emit("folder:deleted", {
          folderId: id,
          noteCount: noteCount + descendantIds.length, // Include subfolders in count
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to delete folder:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [folders, setFolders, user, emit]
  );

  const getFolderById = useCallback(
    (id: string) => {
      return folders.find((folder) => folder.id === id);
    },
    [folders]
  );

  return {
    folders,
    loading,
    error,
    isOperating,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    refreshFolders,
  };
};
