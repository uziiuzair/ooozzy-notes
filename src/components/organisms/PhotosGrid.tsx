"use client";

import React, { useState } from "react";
import { Photo } from "@/types/photo";
import { PhotoCard } from "@/components/molecules/PhotoCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ContextMenu } from "@/components/molecules/ContextMenu";
import { usePhotos } from "@/providers/PhotosProvider";
import { useRouter } from "next/navigation";

interface PhotosGridProps {
  photos: Photo[];
  folderId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhotosGrid({ photos, folderId }: PhotosGridProps) {
  const { updatePhoto, deletePhoto } = usePhotos();
  const router = useRouter();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    photo: Photo;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, photo: Photo) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      photo,
    });
  };

  const handleDelete = async (photo: Photo) => {
    if (confirm(`Are you sure you want to delete "${photo.title}"?`)) {
      await deletePhoto(photo.id);
    }
    setContextMenu(null);
  };

  const handlePin = async (photo: Photo) => {
    await updatePhoto(photo.id, { isPinned: !photo.isPinned });
    setContextMenu(null);
  };

  const handleView = (photo: Photo) => {
    router.push(`/photo/${photo.id}`);
    setContextMenu(null);
  };

  const handleEdit = (photo: Photo) => {
    // TODO: Implement edit functionality
    console.log("Edit photo:", photo);
    setContextMenu(null);
  };

  // Sort photos: pinned first, then by date
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
        title="No photos yet"
        description="Upload your first photo to get started"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedPhotos.map((photo) => (
          <div
            key={photo.id}
            onContextMenu={(e) => handleContextMenu(e, photo)}
          >
            <PhotoCard photo={photo} />
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleView(contextMenu.photo)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </button>
          <button
            onClick={() => handlePin(contextMenu.photo)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {contextMenu.photo.isPinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => handleEdit(contextMenu.photo)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => handleDelete(contextMenu.photo)}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </ContextMenu>
      )}
    </>
  );
}
