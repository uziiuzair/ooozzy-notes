import { FC, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Note } from "@/types/note";
import { Folder } from "@/types/folder";
import { Label } from "@/types/label";
import {
  formatRelativeTime,
  truncateText,
  stripHtmlForPreview,
} from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSubmenu,
} from "@/components/molecules/ContextMenu";
import { LabelBadge } from "@/components/molecules/LabelBadge";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (note: Note) => void;
  onDragEnd?: () => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;
  folders?: Folder[];
  labels?: Label[];
}

export const NoteCard: FC<NoteCardProps> = ({
  note,
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
  onMoveToFolder,
  folders = [],
  labels = [],
}) => {
  const noteLabels = note.labelIds
    ? labels.filter((l) => note.labelIds!.includes(l.id))
    : [];
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(note));
    onDragStart?.(note);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMoveToFolder = (folderId: string | null) => {
    onMoveToFolder?.(note.id, folderId);
    setContextMenu(null);
  };

  return (
    <>
      <Card
        className="relative group cursor-pointer flex flex-col hover:-translate-y-1 transition-all duration-300"
        onClick={onClick}
        onContextMenu={handleContextMenu}
        hoverable
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Pin indicator */}
        {note.isPinned && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-white/90"
            aria-label="Delete note"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Note content */}
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-2">
            <Typography
              variant="h4"
              className="text-base font-semibold line-clamp-1"
            >
              {note.title || "Untitled"}
            </Typography>

            <Typography variant="body" className="line-clamp-3 text-gray-600">
              {truncateText(stripHtmlForPreview(note.content), 150)}
            </Typography>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
            <Typography variant="caption">
              {formatRelativeTime(note.updatedAt)}
            </Typography>

            {/* Labels */}
            {noteLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {noteLabels.slice(0, 1).map((label) => (
                  <LabelBadge key={label.id} label={label} size="sm" />
                ))}
                {noteLabels.length > 1 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{noteLabels.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          {folders.length > 0 && (
            <>
              <ContextMenuSubmenu label="Move to">
                {note.folderId && (
                  <>
                    <ContextMenuItem onClick={() => handleMoveToFolder(null)}>
                      📚 Unfiled Notes
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}
                <div className="max-h-52 overflow-y-auto">
                  {folders
                    .filter((folder) => folder.id !== note.folderId)
                    .map((folder) => (
                      <ContextMenuItem
                        key={folder.id}
                        onClick={() => handleMoveToFolder(folder.id)}
                      >
                        {folder.icon || "📁"} {folder.name}
                      </ContextMenuItem>
                    ))}
                </div>
              </ContextMenuSubmenu>
              <ContextMenuSeparator />
            </>
          )}
          {onDelete && (
            <ContextMenuItem
              onClick={() => {
                onDelete();
                setContextMenu(null);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Note
            </ContextMenuItem>
          )}
        </ContextMenu>
      )}
    </>
  );
};
