import { FC, useState } from "react";
import { FolderCard } from "@/components/molecules/FolderCard";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { Folder } from "@/types/folder";
import { Note } from "@/types/note";
import { cn } from "@/lib/utils";

interface FolderBookshelfProps {
  folders: Folder[];
  notes: Note[];
  selectedFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: (name: string) => void;
  onFolderEdit?: (folder: Folder) => void;
  onFolderDelete?: (folder: Folder) => void;
  onNoteDrop?: (noteId: string, folderId: string | null) => void;
  className?: string;
}

export const FolderBookshelf: FC<FolderBookshelfProps> = ({
  folders,
  notes,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderEdit,
  onFolderDelete,
  onNoteDrop,
  className,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const allNotesCount = notes.filter((note) => !note.folderId).length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const noteData = e.dataTransfer.getData("application/json");
    if (noteData) {
      try {
        const note = JSON.parse(noteData);
        onNoteDrop?.(note.id, folderId);
      } catch (error) {
        console.error("Failed to parse dropped note:", error);
      }
    }
    setDragOverFolderId(null);
  };

  const handleDragEnter = (folderId: string | null) => {
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h3" className="font-semibold">
          Folders
        </Typography>
        <Button onClick={() => setIsCreating(true)} variant="primary" size="sm">
          Add New Folder
        </Button>
      </div>

      {/* All Notes (no folder) - Drop Zone */}
      <div
        className={cn(
          "p-4 rounded-2xl border-2 cursor-pointer transition-all",
          selectedFolderId === null
            ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
          dragOverFolderId === "unfiled" &&
            "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
        )}
        onClick={() => onFolderSelect(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
        onDragEnter={() => handleDragEnter("unfiled")}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <span className="text-2xl">📚</span>
          <div>
            <Typography variant="h4">All Notes</Typography>
            <Typography variant="caption" className="text-gray-500">
              {allNotesCount} {allNotesCount === 1 ? "note" : "notes"}
            </Typography>
          </div>
        </div>
      </div>

      {/* Create new folder input */}
      {isCreating && (
        <div className="flex gap-2">
          <Input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") {
                setIsCreating(false);
                setNewFolderName("");
              }
            }}
            placeholder="Folder name..."
            autoFocus
            className="flex-1"
          />
          <Button onClick={handleCreateFolder} variant="primary" size="sm">
            Create
          </Button>
          <Button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName("");
            }}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Folders grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            notes={notes.filter((note) => note.folderId === folder.id)}
            onClick={() => onFolderSelect(folder.id)}
            onEdit={onFolderEdit ? () => onFolderEdit(folder) : undefined}
            onDelete={onFolderDelete ? () => onFolderDelete(folder) : undefined}
            onDrop={
              onNoteDrop
                ? (noteId, folderId) => onNoteDrop(noteId, folderId)
                : undefined
            }
            isActive={selectedFolderId === folder.id}
          />
        ))}
      </div>

      {folders.length === 0 && !isCreating && (
        <div className="text-center py-8">
          <Typography variant="body" className="text-gray-500 mb-4">
            No folders yet. Create one to organize your notes!
          </Typography>
        </div>
      )}
    </div>
  );
};
