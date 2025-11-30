"use client";

import { FC, useState, useEffect } from "react";
import { Modal } from "@/components/molecules/Modal";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Folder } from "@/types/folder";
import { Label } from "@/types/label";

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  labels?: Label[];
  onSave: (id: string, updates: Partial<Folder>) => void;
}

export const EditFolderModal: FC<EditFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  labels = [],
  onSave,
}) => {
  const [name, setName] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Initialize form with folder data
  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setSelectedLabelIds(folder.labelIds || []);
    } else {
      // Reset form when modal closes
      setName("");
      setSelectedLabelIds([]);
    }
  }, [folder]);

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = () => {
    if (!folder) return;

    const updates: Partial<Folder> = {
      name,
      labelIds: selectedLabelIds,
    };

    onSave(folder.id, updates);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!folder) return null;

  return (
    <Modal
      isOpen={isOpen}
      handleClose={onClose}
      title="Edit Folder"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Folder Name Input */}
        <Input
          label="Folder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter folder name"
          className="rounded-lg"
        />

        {/* Labels Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Labels
          </label>

          {labels.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {labels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-purple-500 border-purple-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Label Name */}
                      <span className="font-medium text-gray-900">
                        {label.name}
                      </span>
                    </div>

                    {/* Color Badge */}
                    {label.color && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: label.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No labels available</p>
              <p className="text-xs mt-1">Create labels to organize your folders</p>
            </div>
          )}

          {/* Selected Labels Preview */}
          {selectedLabelIds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-2">
                Selected Labels:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedLabelIds.map((labelId) => {
                  const label = labels.find((l) => l.id === labelId);
                  if (!label) return null;
                  return (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {label.color && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                      )}
                      {label.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
