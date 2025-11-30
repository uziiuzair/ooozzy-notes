import { FC } from "react";
import { NoteCard } from "@/components/molecules/NoteCard";
import { Note } from "@/types/note";
import { cn } from "@/lib/utils";

import { Folder } from "@/types/folder";

interface NotesGridProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteDelete?: (note: Note) => void;
  onCreateNote?: () => void;
  onNoteDragStart?: (note: Note) => void;
  onNoteDragEnd?: () => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;
  folders?: Folder[];
  className?: string;
  loading?: boolean;
}

export const NotesGrid: FC<NotesGridProps> = ({
  notes,
  onNoteClick,
  onNoteDelete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCreateNote,
  onNoteDragStart,
  onNoteDragEnd,
  onMoveToFolder,
  folders = [],
  className,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
          className
        )}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return null;
  }

  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {sortedNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onClick={() => onNoteClick(note)}
          onDelete={onNoteDelete ? () => onNoteDelete(note) : undefined}
          onDragStart={onNoteDragStart}
          onDragEnd={onNoteDragEnd}
          onMoveToFolder={onMoveToFolder}
          folders={folders}
        />
      ))}
    </div>
  );
};
