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
import { Label } from "@/types/label";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface LabelsContextType {
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  loading: boolean;
  error: string | null;
  refreshLabels: () => Promise<void>;
}

export const LabelsContext = createContext<LabelsContextType>({
  labels: [],
  setLabels: () => {},
  loading: true,
  error: null,
  refreshLabels: async () => {},
});

export const useLabelsContext = () => {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error("useLabelsContext must be used within LabelsProvider");
  }
  return context;
};

interface LabelsProviderProps {
  children: ReactNode;
}

export const LabelsProvider: FC<LabelsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLabels = useCallback(async () => {
    // Only fetch labels for authenticated users
    if (!user) {
      setLabels([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const adapter = getStorageAdapter(user.uid);
      const loadedLabels = await adapter.getLabels();
      setLabels(loadedLabels);
    } catch (err) {
      console.error("Failed to load labels:", err);
      setError("Failed to load labels");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load labels on mount and when auth state changes
  useEffect(() => {
    refreshLabels();
  }, [refreshLabels]);

  return (
    <LabelsContext.Provider
      value={{ labels, setLabels, loading, error, refreshLabels }}
    >
      {children}
    </LabelsContext.Provider>
  );
};
