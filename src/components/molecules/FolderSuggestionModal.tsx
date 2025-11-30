"use client";

import { Button } from "@/components/atoms/Button";

interface FolderSuggestionModalProps {
  isOpen: boolean;
  folderName: string;
  onMove: () => void | Promise<void>;
  onDismiss: () => void;
}

export function FolderSuggestionModal({
  isOpen,
  folderName,
  onMove,
  onDismiss,
}: FolderSuggestionModalProps) {
  if (!isOpen) return null;

  const handleMove = async () => {
    await onMove();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onDismiss}
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
              Move to folder?
            </h3>
            <p className="mt-2 text-base text-gray-600">
              This card has matching labels with the{" "}
              <span className="font-medium text-electric-violet">
                &ldquo;{folderName}&rdquo;
              </span>{" "}
              folder.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleMove}
              className="bg-electric-violet text-white hover:bg-electric-violet/90"
            >
              Move to {folderName}
            </Button>
            <Button onClick={onDismiss} variant="secondary" className="grow">
              Keep here
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
