"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { File } from "@/types/file";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface FilesContextType {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  loading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const adapter = getStorageAdapter(user?.uid);
      const fetchedFiles = await adapter.getFiles();
      setFiles(fetchedFiles);
    } catch (err) {
      console.error("Failed to fetch files:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFiles();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FilesContext.Provider
      value={{
        files,
        setFiles,
        loading,
        error,
        refreshFiles,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
};

export const useFilesContext = () => {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error("useFilesContext must be used within a FilesProvider");
  }
  return context;
};
