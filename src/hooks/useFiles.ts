import { useCallback, useState } from "react";
import { useFilesContext } from "@/providers/FilesProvider";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { FileInput, FileUpdate } from "@/types/file";
import { useEvents } from "@/hooks/useEvents";

// Helper to detect file type from MIME type
const detectFileType = (
  mimeType: string
): "document" | "video" | "audio" | "archive" | "other" => {
  if (mimeType.startsWith("application/pdf") || mimeType.includes("document") || mimeType.includes("word") || mimeType.includes("text")) {
    return "document";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  ) {
    return "archive";
  }
  return "other";
};

export const useFiles = () => {
  const { user } = useAuth();
  const { files, setFiles, loading, error, refreshFiles } = useFilesContext();
  const [isOperating, setIsOperating] = useState(false);
  const { emit } = useEvents();

  const uploadFile = useCallback(
    async (file: File, folderId?: string) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date().toISOString();

      // Detect file type
      const fileType = detectFileType(file.type);

      // Create optimistic file metadata
      const optimisticFile = {
        id: tempId,
        name: file.name,
        url: "", // Will be filled after upload
        storagePath: "",
        mimeType: file.type,
        size: file.size,
        fileType,
        folderId,
        createdAt: now,
        updatedAt: now,
      };

      // Add optimistic file to state immediately
      console.log("🟢 [useFiles] Adding optimistic file to state:", optimisticFile);
      setFiles((prev) => [...prev, optimisticFile]);

      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);

        // Prepare metadata for upload
        const metadata: FileInput = {
          name: file.name,
          url: "", // Will be set by adapter
          storagePath: "", // Will be set by adapter
          mimeType: file.type,
          size: file.size,
          fileType,
          folderId,
        };
        console.log("🟢 [useFiles] Calling adapter.uploadFile with metadata:", metadata);

        const uploadedFile = await adapter.uploadFile(file, metadata);
        console.log("✅ [useFiles] File uploaded successfully:", uploadedFile);

        // Replace optimistic file with real one from Firebase
        setFiles((prev) =>
          prev.map((f) => (f.id === tempId ? uploadedFile : f))
        );
        console.log("✅ [useFiles] Replaced optimistic file with real file in state");

        // Emit event
        emit("file:uploaded", {
          fileId: uploadedFile.id,
          name: uploadedFile.name,
          fileType: uploadedFile.fileType,
          size: uploadedFile.size,
          folderId: uploadedFile.folderId || null,
          timestamp: Date.now(),
        });
        console.log("✅ [useFiles] Emitted file:uploaded event");

        return uploadedFile;
      } catch (error) {
        console.error("❌ [useFiles] Upload failed:", error);
        // Rollback optimistic update on error
        setFiles((prev) => prev.filter((f) => f.id !== tempId));
        console.log("❌ [useFiles] Rolled back optimistic update");
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setFiles, user, emit]
  );

  const updateFile = useCallback(
    async (id: string, updates: FileUpdate) => {
      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user?.uid);
        const updatedFile = await adapter.updateFile(id, updates);
        setFiles((prev) => prev.map((file) => (file.id === id ? updatedFile : file)));

        // Emit event
        emit("file:updated", {
          fileId: id,
          folderId: updatedFile.folderId || null,
          fieldsUpdated: Object.keys(updates),
          timestamp: Date.now(),
        });

        return updatedFile;
      } catch (error) {
        console.error("Failed to update file:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setFiles, user, emit]
  );

  const deleteFile = useCallback(
    async (id: string) => {
      try {
        setIsOperating(true);
        // Get file before deleting to capture folderId for event
        const fileToDelete = files.find((f) => f.id === id);
        const adapter = getStorageAdapter(user?.uid);
        await adapter.deleteFile(id);
        setFiles((prev) => prev.filter((file) => file.id !== id));

        // Emit event
        emit("file:deleted", {
          fileId: id,
          folderId: fileToDelete?.folderId || null,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to delete file:", error);
        throw error;
      } finally{
        setIsOperating(false);
      }
    },
    [files, setFiles, user, emit]
  );

  const getFileById = useCallback(
    (id: string) => {
      return files.find((file) => file.id === id);
    },
    [files]
  );

  return {
    files,
    loading,
    error,
    isOperating,
    uploadFile,
    updateFile,
    deleteFile,
    getFileById,
    refreshFiles,
  };
};
