import { useCallback, useState } from "react";
import { useLabelsContext } from "@/providers/LabelsProvider";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { LabelInput, LabelUpdate } from "@/types/label";
import { useEvents } from "@/hooks/useEvents";

export const useLabels = () => {
  const { user } = useAuth();
  const { labels, setLabels, loading, error, refreshLabels } =
    useLabelsContext();
  const [isOperating, setIsOperating] = useState(false);
  const { emit } = useEvents();

  const createLabel = useCallback(
    async (labelInput: LabelInput) => {
      if (!user) {
        throw new Error("Must be authenticated to create labels");
      }

      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user.uid);
        const newLabel = await adapter.createLabel(labelInput);
        setLabels((prev) => [...prev, newLabel]);

        // Emit event
        emit("label:created", {
          labelId: newLabel.id,
          name: newLabel.name,
          timestamp: Date.now(),
        });

        return newLabel;
      } catch (error) {
        console.error("Failed to create label:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setLabels, user, emit]
  );

  const updateLabel = useCallback(
    async (id: string, updates: LabelUpdate) => {
      if (!user) {
        throw new Error("Must be authenticated to update labels");
      }

      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user.uid);
        const updatedLabel = await adapter.updateLabel(id, updates);
        setLabels((prev) =>
          prev.map((label) => (label.id === id ? updatedLabel : label))
        );

        // Emit event
        emit("label:updated", {
          labelId: id,
          fieldsUpdated: Object.keys(updates),
          timestamp: Date.now(),
        });

        return updatedLabel;
      } catch (error) {
        console.error("Failed to update label:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setLabels, user, emit]
  );

  const deleteLabel = useCallback(
    async (id: string) => {
      if (!user) {
        throw new Error("Must be authenticated to delete labels");
      }

      try {
        setIsOperating(true);
        const adapter = getStorageAdapter(user.uid);
        await adapter.deleteLabel(id);
        setLabels((prev) => prev.filter((label) => label.id !== id));

        // Emit event
        emit("label:deleted", {
          labelId: id,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to delete label:", error);
        throw error;
      } finally {
        setIsOperating(false);
      }
    },
    [setLabels, user, emit]
  );

  const getLabelById = useCallback(
    (id: string) => {
      return labels.find((label) => label.id === id);
    },
    [labels]
  );

  const getLabelsByIds = useCallback(
    (ids: string[]) => {
      return labels.filter((label) => ids.includes(label.id));
    },
    [labels]
  );

  return {
    labels,
    loading,
    error,
    isOperating,
    createLabel,
    updateLabel,
    deleteLabel,
    getLabelById,
    getLabelsByIds,
    refreshLabels,
  };
};
