"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Note } from "@/types/note";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";
import { Folder } from "@/types/folder";
import { NoteCard } from "@/components/molecules/NoteCard";
import { PhotoCard } from "@/components/molecules/PhotoCard";
import { LinkCard } from "@/components/molecules/LinkCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ContextMenu } from "@/components/molecules/ContextMenu";
import { useRouter } from "next/navigation";

interface ContentItem {
  type: "note" | "photo" | "link";
  data: Note | Photo | Link;
  createdAt: string;
  isPinned?: boolean;
}

interface ContentGridProps {
  notes: Note[];
  photos: Photo[];
  links: Link[];
  folders: Folder[];
  loadingMetadataIds?: Set<string>;
  onNoteClick?: (note: Note) => void;
  onNoteDelete?: (note: Note) => void;
  onPhotoDelete?: (photo: Photo) => void;
  onLinkDelete?: (link: Link) => void;
  onNoteUpdate?: (id: string, updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onPhotoUpdate?: (id: string, updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onLinkUpdate?: (id: string, updates: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onNoteEdit?: (note: Note) => void;
  onPhotoEdit?: (photo: Photo) => void;
  onLinkEdit?: (link: Link) => void;
  onLinkRefreshMetadata?: (link: Link) => void;
  onNoteDragStart?: (note: Note) => void;
  onPhotoDragStart?: (photo: Photo) => void;
  onLinkDragStart?: (link: Link) => void;
  onDragEnd?: () => void;
  onMoveToFolder?: (
    itemId: string,
    folderId: string | null,
    itemType: "note" | "photo" | "link"
  ) => void;
  onCreateNote?: () => void;
  loading?: boolean;
}

export function ContentGrid({
  notes,
  photos,
  links,
  folders,
  loadingMetadataIds,
  onNoteClick,
  onNoteDelete,
  onPhotoDelete,
  onLinkDelete,
  onNoteUpdate,
  onPhotoUpdate,
  onLinkUpdate,
  onNoteEdit,
  onPhotoEdit,
  onLinkEdit,
  onNoteDragStart,
  onPhotoDragStart,
  onLinkDragStart,
  onDragEnd,
  onMoveToFolder,
  onLinkRefreshMetadata,
  onCreateNote,
  loading = false,
}: ContentGridProps) {
  const router = useRouter();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: ContentItem;
  } | null>(null);

  // Combine notes, photos, and links into a single array
  const contentItems: ContentItem[] = [
    ...notes.map((note) => ({
      type: "note" as const,
      data: note,
      createdAt: note.createdAt,
      isPinned: note.isPinned,
    })),
    ...photos.map((photo) => ({
      type: "photo" as const,
      data: photo,
      createdAt: photo.createdAt,
      isPinned: photo.isPinned,
    })),
    ...links.map((link) => ({
      type: "link" as const,
      data: link,
      createdAt: link.createdAt.toString(),
      isPinned: link.isPinned,
    })),
  ];

  // Sort by pinned first, then by date
  const sortedContent = contentItems.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleContextMenu = (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    if (item.type === "note") {
      const note = item.data as Note;
      onNoteDelete?.(note);
    } else if (item.type === "photo") {
      const photo = item.data as Photo;
      onPhotoDelete?.(photo);
    } else {
      const link = item.data as Link;
      onLinkDelete?.(link);
    }
    setContextMenu(null);
  };

  const handlePin = async () => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    if (item.type === "note") {
      const note = item.data as Note;
      onNoteUpdate?.(note.id, { isPinned: !note.isPinned });
    } else if (item.type === "photo") {
      const photo = item.data as Photo;
      onPhotoUpdate?.(photo.id, { isPinned: !photo.isPinned });
    } else {
      const link = item.data as Link;
      onLinkUpdate?.(link.id, { isPinned: !link.isPinned });
    }
    setContextMenu(null);
  };

  const handleView = () => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    if (item.type === "note") {
      const note = item.data as Note;
      router.push(`/note/${note.id}`);
    } else if (item.type === "photo") {
      const photo = item.data as Photo;
      router.push(`/photo/${photo.id}`);
    } else {
      const link = item.data as Link;
      window.open(link.url, "_blank");
    }
    setContextMenu(null);
  };

  const handleEdit = () => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    if (item.type === "note") {
      const note = item.data as Note;
      onNoteEdit?.(note);
    } else if (item.type === "photo") {
      const photo = item.data as Photo;
      onPhotoEdit?.(photo);
    } else {
      const link = item.data as Link;
      onLinkEdit?.(link);
    }
    setContextMenu(null);
  };

  const handleMoveToFolder = (folderId: string | null) => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    onMoveToFolder?.(item.data.id, folderId, item.type);
    setContextMenu(null);
  };

  const handleRefreshMetadata = async () => {
    if (!contextMenu) return;

    const { item } = contextMenu;
    if (item.type === "link") {
      const link = item.data as Link;
      onLinkRefreshMetadata?.(link);
    }
    setContextMenu(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (sortedContent.length === 0) {
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        title="No content yet"
        description="Create a note or upload a photo to get started"
        onAction={onCreateNote}
      />
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {sortedContent.map((item, index) => (
          <motion.div
            key={`${item.type}-${item.data.id}`}
            onContextMenu={(e) => handleContextMenu(e, item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="break-inside-avoid mb-6"
          >
            {item.type === "note" ? (
              <NoteCard
                note={item.data as Note}
                onClick={() => onNoteClick?.(item.data as Note)}
                onDragStart={() => onNoteDragStart?.(item.data as Note)}
                onDragEnd={onDragEnd}
              />
            ) : item.type === "photo" ? (
              <PhotoCard
                photo={item.data as Photo}
                onDragStart={() => onPhotoDragStart?.(item.data as Photo)}
                onDragEnd={onDragEnd}
              />
            ) : (
              <LinkCard
                link={item.data as Link}
                isLoadingMetadata={loadingMetadataIds?.has(
                  (item.data as Link).id
                )}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      type: "link",
                      id: (item.data as Link).id,
                      url: (item.data as Link).url,
                    })
                  );
                  onLinkDragStart?.(item.data as Link);
                }}
                onDragEnd={onDragEnd}
              />
            )}
          </motion.div>
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
            onClick={handleView}
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
            onClick={handleEdit}
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
          <button
            onClick={handlePin}
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
            {contextMenu.item.isPinned ? "Unpin" : "Pin"}
          </button>

          {/* Refresh Metadata - only for links */}
          {contextMenu.item.type === "link" && (
            <>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={handleRefreshMetadata}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Metadata
              </button>
            </>
          )}

          {/* Move to folder submenu */}
          <div className="border-t border-gray-200 my-1" />
          <div className="px-4 py-1 text-xs text-gray-500 uppercase">
            Move to
          </div>
          <div className="h-36 overflow-y-auto">
            <button
              onClick={() => handleMoveToFolder(null)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Root (No folder)
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                {folder.name}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={handleDelete}
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
