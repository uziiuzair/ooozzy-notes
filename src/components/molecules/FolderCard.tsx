import { FC, useState } from "react";
import { motion } from "framer-motion";
import { Typography } from "@/components/atoms/Typography";
import { Folder } from "@/types/folder";
import { Note } from "@/types/note";
import { Photo } from "@/types/photo";
import { truncateText, stripHtmlForPreview } from "@/lib/utils";
import { useProximityEffect } from "@/hooks/useProximityEffect";
import clsx from "clsx";

interface FolderCardProps {
  folder: Folder;
  notes?: Note[];
  photos?: Photo[];
  links?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDrop?: (
    itemId: string,
    folderId: string,
    itemType: "note" | "photo" | "link"
  ) => void;
  isActive?: boolean;
}

export const FolderCard: FC<FolderCardProps> = ({
  folder,
  notes = [],
  photos = [],
  links = [],
  onClick,
  onEdit,
  onDelete,
  onDrop,
  isActive = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { ref, proximity } = useProximityEffect(200);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const item = JSON.parse(data);
        if (item.type === "photo") {
          // Handle photo drop
          onDrop?.(item.id, folder.id, "photo");
        } else if (item.type === "link") {
          // Handle link drop
          onDrop?.(item.id, folder.id, "link");
        } else {
          // Handle note drop
          onDrop?.(item.id, folder.id, "note");
        }
      } catch (error) {
        console.error("Failed to parse dropped item:", error);
      }
    }
    setIsDragOver(false);
  };

  const handleDragEnter = () => {
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Get up to 4 notes for preview
  const previewNotes = notes.slice(0, 4);

  // Calculate directional shadow based on mouse position
  // const shadowX = proximity.intensity > 0 ? (proximity.x - 50) / 10 : 0;
  // const shadowY = proximity.intensity > 0 ? (proximity.y - 50) / 10 : 0;

  // Clamp proximity position to card edges for border effect
  const clampedX = Math.max(0, Math.min(100, proximity.x));
  const clampedY = Math.max(0, Math.min(100, proximity.y));

  // Check if folder is optimistic (temporary ID)
  const isOptimistic = folder.id.startsWith("temp-");

  const proximityStyle =
    proximity.intensity > 0
      ? {
          background: `
          radial-gradient(
            circle at ${clampedX}% ${clampedY}%,
            rgba(92, 113, 110, ${proximity.intensity * 0.6}) 0%,
            rgba(92, 113, 110, ${proximity.intensity * 0.3}) 10%,
            rgba(255, 255, 255, ${proximity.intensity * 0.8}) 20%,
            white 30%
          )
        `,
        }
      : {
          background: "white",
        };

  return (
    <motion.div
      ref={ref}
      className="relative group cursor-pointer"
      onClick={onClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
    >
      {/* Outer container with proximity effect - acts as border */}
      <motion.div
        className={clsx(
          "relative w-full p-px rounded-lg border border-slate-200 transition-all duration-300",
          {
            "ring-2 ring-gray-400": isActive,
            "ring-2 ring-blue-500": isDragOver,
            "opacity-70": isOptimistic,
          }
        )}
        style={proximityStyle}
      >
        {/* Inner container with white background and content */}
        <div className="relative w-full h-full bg-white backdrop-blur-md rounded-lg overflow-hidden">
          {/* Optimistic loading indicator */}
          {isOptimistic && (
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Saving...</span>
              </div>
            </div>
          )}
          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-white/90 hover:bg-white"
                  aria-label="Delete folder"
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
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
                </button>
              )}
            </div>
          )}

          {/* Notes Preview Grid */}
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 h-full">
              {[0, 1, 2, 3].map((index) => {
                const note = previewNotes[index];
                return (
                  <div
                    key={index}
                    className={clsx(
                      "rounded-xl aspect-square p-3 overflow-hidden",
                      {
                        "bg-white/50 border border-gray-200": note,
                        "bg-gray-100/30 border border-dashed border-gray-300":
                          !note,
                      }
                    )}
                  >
                    {note ? (
                      <div className="h-full flex flex-col">
                        <div className="text-xs font-medium text-gray-900 line-clamp-1 mb-1">
                          {note.title || "Untitled"}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                          {truncateText(stripHtmlForPreview(note.content), 10)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-lg bg-gray-200/30" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Folder Name at Bottom */}
          <div className="w-full h-full bg-gradient-to-t from-white via-white to-transparent pb-3 px-4">
            <Typography variant="h4" className="font-semibold truncate">
              {folder.name}
            </Typography>
            <div className="flex items-center gap-2">
              <Typography variant="caption" className="text-gray-500">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </Typography>
              {photos.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <Typography variant="caption" className="text-gray-500">
                    {photos.length} {photos.length === 1 ? "photo" : "photos"}
                  </Typography>
                </>
              )}
              {links.length > 0 && (
                <>
                  <span className="text-gray-400">•</span>
                  <Typography variant="caption" className="text-gray-500">
                    {links.length} {links.length === 1 ? "link" : "links"}
                  </Typography>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
