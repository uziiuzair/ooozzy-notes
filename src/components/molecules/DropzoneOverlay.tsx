"use client";

import { FC } from "react";

interface DropzoneOverlayProps {
  isActive: boolean;
  isDraggingOverFolder?: boolean;
}

export const DropzoneOverlay: FC<DropzoneOverlayProps> = ({
  isActive,
  isDraggingOverFolder = false,
}) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-electric-violet/10 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-dashed border-electric-violet p-12 max-w-md mx-4 animate-in zoom-in-95 duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-electric-violet/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-electric-violet"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDraggingOverFolder ? "Drop into Folder" : "Drop to Upload"}
            </h3>
            <p className="text-sm text-gray-600">
              {isDraggingOverFolder
                ? "Release to add files to this folder"
                : "Images become Photos, other files become Files"}
            </p>
          </div>

          {/* Supported formats hint */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Supports: Images, Videos, Audio, Documents, Archives (max 50MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
