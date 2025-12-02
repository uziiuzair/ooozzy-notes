"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { LabelSelector } from "@/components/molecules/LabelSelector";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, labelIds: string[]) => void;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onSave,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!folderName.trim()) return;
    onSave(folderName.trim(), selectedLabelIds);
    // Reset state
    setFolderName("");
    setSelectedLabelIds([]);
    onClose();
  };

  const handleClose = () => {
    // Reset state
    setFolderName("");
    setSelectedLabelIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-gray-100"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Folder
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Give your folder a name and optionally select labels to organize
              cards.
            </p>
          </div>

          {/* Folder name input */}
          <div>
            <label
              htmlFor="folder-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-electric-violet focus:outline-none focus:ring-2 focus:ring-electric-violet/20"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && folderName.trim()) {
                  handleSave();
                }
              }}
            />
          </div>

          {/* Label selection */}
          <div>
            <LabelSelector
              onSelectionChange={setSelectedLabelIds}
              selectedLabelIds={selectedLabelIds}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!folderName.trim()}
              className="flex-1 bg-electric-violet text-white hover:bg-electric-violet/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Folder
            </Button>
            <Button
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
