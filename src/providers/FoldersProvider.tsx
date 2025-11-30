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
import { Folder } from "@/types/folder";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface FoldersContextType {
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  loading: boolean;
  error: string | null;
  refreshFolders: () => Promise<void>;
}

export const FoldersContext = createContext<FoldersContextType>({
  folders: [],
  setFolders: () => {},
  loading: true,
  error: null,
  refreshFolders: async () => {},
});

export const useFoldersContext = () => {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error("useFoldersContext must be used within FoldersProvider");
  }
  return context;
};

interface FoldersProviderProps {
  children: ReactNode;
}

export const FoldersProvider: FC<FoldersProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const adapter = getStorageAdapter(user?.uid);
      const loadedFolders = await adapter.getFolders();
      setFolders(loadedFolders);
    } catch (err) {
      console.error("Failed to load folders:", err);
      setError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load folders on mount and when auth state changes
  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  return (
    <FoldersContext.Provider
      value={{ folders, setFolders, loading, error, refreshFolders }}
    >
      {children}
    </FoldersContext.Provider>
  );
};
