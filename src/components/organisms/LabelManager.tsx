"use client";

import { FC, useState, useEffect } from "react";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { Note } from "@/types/note";
import { Link } from "@/types/link";
import { Photo } from "@/types/photo";
import { Label } from "@/types/label";
import { LabelBadge } from "@/components/molecules/LabelBadge";

type ContentItem = Note | Link | Photo;

interface LabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
  type: "note" | "link" | "photo";
  labels: Label[];
  onSave: (id: string, labelIds: string[]) => void;
}

export const LabelManager: FC<LabelManagerProps> = ({
  isOpen,
  onClose,
  item,
  type,
  labels,
  onSave,
}) => {
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Initialize form with item data
  useEffect(() => {
    if (item) {
      setSelectedLabelIds(item.labelIds || []);
    } else {
      setSelectedLabelIds([]);
    }
  }, [item]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = () => {
    if (!item) return;
    onSave(item.id, selectedLabelIds);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!item) return null;

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Modal
      isOpen={isOpen}
      handleClose={onClose}
      title={`Manage Labels - ${typeLabel}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Labels
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Item Title */}
        <div className="pb-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.title || "Untitled"}
          </p>
        </div>

        {/* Label Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Labels
          </label>

          {labels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No labels available</p>
              <p className="text-xs text-gray-400 mt-2">
                Create labels from the Labels page
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {labels.map((label) => (
                <label
                  key={label.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedLabelIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <LabelBadge label={label} size="md" />
                </label>
              ))}
            </div>
          )}

          {/* Selected Labels Preview */}
          {selectedLabelIds.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs font-medium text-purple-900 mb-2">
                Selected labels ({selectedLabelIds.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {labels
                  .filter((l) => selectedLabelIds.includes(l.id))
                  .map((label) => (
                    <LabelBadge key={label.id} label={label} size="sm" />
                  ))}
              </div>
            </div>
          )}

          {selectedLabelIds.length === 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                No labels selected
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
