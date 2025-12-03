"use client";

import { FC, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ContentGrid } from "@/components/organisms/ContentGrid";
import { FolderCard } from "@/components/molecules/FolderCard";
import { CreateFolderModal } from "@/components/molecules/CreateFolderModal";
import { SearchBar } from "@/components/molecules/SearchBar";
import { AddNewDropdown } from "@/components/molecules/AddNewDropdown";
import { Breadcrumb, BreadcrumbItem } from "@/components/molecules/Breadcrumb";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/molecules/ContextMenu";
import { DropzoneOverlay } from "@/components/molecules/DropzoneOverlay";
import { Modal } from "@/components/molecules/Modal";
import { ConfirmModal } from "@/components/molecules/ConfirmModal";
import { PromptModal } from "@/components/molecules/PromptModal";
import { AlertModal } from "@/components/molecules/AlertModal";
import { EditCardModal } from "@/components/organisms/EditCardModal";
import { EditFolderModal } from "@/components/organisms/EditFolderModal";
import { useNotes } from "@/hooks/useNotes";
import { usePhotos } from "@/providers/PhotosProvider";
import { useLinks } from "@/providers/LinksProvider";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
import { useLabels } from "@/hooks/useLabels";
import { Note } from "@/types/note";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";
import { File as FileType } from "@/types/file";
import { Folder } from "@/types/folder";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Logo from "../../../public/Logo.svg";
import { LabelSelector } from "@/components/molecules/LabelSelector";

export const DashboardTemplate: FC = () => {
  const router = useRouter();
  const { notes, loading, createNote, deleteNote, searchNotes, updateNote } =
    useNotes();
  const { photos, uploadPhoto, deletePhoto, updatePhoto, getPhotosByFolder } =
    usePhotos();
  const {
    links,
    loadingMetadataIds,
    addLink,
    deleteLink,
    updateLink,
    refreshLinkMetadata,
  } = useLinks();
  const { files, uploadFile, deleteFile, updateFile } = useFiles();
  const { folders, createFolder, deleteFolder, updateFolder } = useFolders();
  const { labels, createLabel } = useLabels();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<typeof files>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [, setDraggedNote] = useState<Note | null>(null);
  const [, setDraggedPhoto] = useState<Photo | null>(null);
  const [, setDraggedLink] = useState<Link | null>(null);
  const [, setDraggedFile] = useState<FileType | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    x: number;
    y: number;
    folder: Folder;
  } | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingLabelIds, setEditingLabelIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "primary";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    onSubmit: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    variant?: "info" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    message: "",
  });

  // Edit modal states
  const [editCardModal, setEditCardModal] = useState<{
    isOpen: boolean;
    item: Note | Photo | Link | FileType | null;
    type: "note" | "photo" | "link" | "file" | null;
  }>({
    isOpen: false,
    item: null,
    type: null,
  });

  const [editFolderModal, setEditFolderModal] = useState<{
    isOpen: boolean;
    folder: Folder | null;
  }>({
    isOpen: false,
    folder: null,
  });

  // Global dropzone state
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dragCounter, setDragCounter] = useState(0);

  // Background context menu state
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Helper function to build breadcrumb trail
  const buildBreadcrumbs = (folderId: string | null): BreadcrumbItem[] => {
    if (!folderId) {
      return [{ id: null, label: "Home" }];
    }

    const trail: BreadcrumbItem[] = [];
    let currentId: string | null = folderId;

    // Build trail from current folder back to root
    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;

      trail.unshift({ id: folder.id, label: folder.name });
      currentId = folder.parentId || null;
    }

    // Add Home at the beginning
    trail.unshift({ id: null, label: "Home" });
    return trail;
  };

  // Get folders to display (only children of current folder)
  const getVisibleFolders = (): Folder[] => {
    if (currentFolderId) {
      // Inside a folder - show only subfolders
      return folders.filter((f) => f.parentId === currentFolderId);
    } else {
      // Root level - show only folders without a parent
      return folders.filter((f) => !f.parentId);
    }
  };

  useEffect(() => {
    // Filter notes based on current folder
    let notesToShow = notes;
    if (currentFolderId) {
      // Inside a folder - show only notes in this folder
      notesToShow = notes.filter((note) => note.folderId === currentFolderId);
    } else {
      // Root level - show only notes without a folder
      notesToShow = notes.filter((note) => !note.folderId);
    }
    setFilteredNotes(notesToShow);

    // Filter photos based on current folder
    let photosToShow = photos;
    if (currentFolderId) {
      photosToShow = getPhotosByFolder(currentFolderId);
    } else {
      photosToShow = photos.filter((photo) => !photo.folderId);
    }
    setFilteredPhotos(photosToShow);

    // Filter links based on current folder
    let linksToShow = links;
    if (currentFolderId) {
      linksToShow = links.filter((link) => link.folderId === currentFolderId);
    } else {
      linksToShow = links.filter((link) => !link.folderId);
    }
    setFilteredLinks(linksToShow);

    // Filter files based on current folder
    let filesToShow = files;
    if (currentFolderId) {
      filesToShow = files.filter((file) => file.folderId === currentFolderId);
    } else {
      filesToShow = files.filter((file) => !file.folderId);
    }
    setFilteredFiles(filesToShow);
  }, [notes, photos, links, files, currentFolderId, getPhotosByFolder]);

  // Add paste event listener for links
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text) {
        // Check if it's a URL
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const url = new URL(text);
          // Valid URL, add as link
          e.preventDefault();
          const newLink = await addLink(text);
          // If we're in a folder, update the link with the folder ID
          if (currentFolderId && newLink) {
            await updateLink(newLink.id, { folderId: currentFolderId });
          }
        } catch {
          // Not a URL, ignore
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addLink, currentFolderId, updateLink]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Search notes
      const noteResults = await searchNotes(query);
      if (currentFolderId) {
        setFilteredNotes(
          noteResults.filter((note) => note.folderId === currentFolderId)
        );
      } else {
        setFilteredNotes(noteResults.filter((note) => !note.folderId));
      }

      // Search photos
      const lowerQuery = query.toLowerCase();
      const photosToSearch = currentFolderId
        ? getPhotosByFolder(currentFolderId)
        : photos.filter((photo) => !photo.folderId);

      setFilteredPhotos(
        photosToSearch.filter(
          (photo) =>
            photo.title.toLowerCase().includes(lowerQuery) ||
            photo.caption?.toLowerCase().includes(lowerQuery) ||
            photo.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        )
      );

      // Search links
      const linksToSearch = currentFolderId
        ? links.filter((link) => link.folderId === currentFolderId)
        : links.filter((link) => !link.folderId);

      setFilteredLinks(
        linksToSearch.filter(
          (link) =>
            link.title.toLowerCase().includes(lowerQuery) ||
            link.description?.toLowerCase().includes(lowerQuery) ||
            link.domain.toLowerCase().includes(lowerQuery) ||
            link.url.toLowerCase().includes(lowerQuery)
        )
      );

      // Search files
      const filesToSearch = currentFolderId
        ? files.filter((file) => file.folderId === currentFolderId)
        : files.filter((file) => !file.folderId);

      setFilteredFiles(
        filesToSearch.filter(
          (file) =>
            file.name.toLowerCase().includes(lowerQuery) ||
            file.fileType.toLowerCase().includes(lowerQuery) ||
            file.mimeType.toLowerCase().includes(lowerQuery)
        )
      );
    } else {
      // Reset to folder-filtered content
      if (currentFolderId) {
        setFilteredNotes(
          notes.filter((note) => note.folderId === currentFolderId)
        );
        setFilteredPhotos(getPhotosByFolder(currentFolderId));
        setFilteredLinks(
          links.filter((link) => link.folderId === currentFolderId)
        );
        setFilteredFiles(
          files.filter((file) => file.folderId === currentFolderId)
        );
      } else {
        setFilteredNotes(notes.filter((note) => !note.folderId));
        setFilteredPhotos(photos.filter((photo) => !photo.folderId));
        setFilteredLinks(links.filter((link) => !link.folderId));
        setFilteredFiles(files.filter((file) => !file.folderId));
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        try {
          await uploadPhoto(file, currentFolderId || undefined);
          successCount++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          failCount++;
          const errorMessage = error.message || "Failed to upload image";
          if (!errors.includes(errorMessage)) {
            errors.push(errorMessage);
          }
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
    }

    // Show results to user
    if (successCount > 0 && failCount === 0) {
      // All successful - no alert needed, photos will appear
    } else if (successCount > 0 && failCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Upload Partially Successful",
        message: `Uploaded ${successCount} photo(s) successfully.\n${failCount} photo(s) failed:\n${errors.join(
          "\n"
        )}`,
        variant: "warning",
      });
    } else if (failCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Upload Failed",
        message: `Failed to upload photos:\n${errors.join(
          "\n"
        )}\n\nTip: If you're seeing storage quota errors, try clearing some existing photos or using smaller images.`,
        variant: "error",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        await uploadFile(file, currentFolderId || undefined);
        successCount++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        failCount++;
        const errorMessage = error.message || "Failed to upload file";
        if (!errors.includes(errorMessage)) {
          errors.push(errorMessage);
        }
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    // Show results to user
    if (successCount > 0 && failCount === 0) {
      // All successful - no alert needed, files will appear
    } else if (successCount > 0 && failCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Upload Partially Successful",
        message: `Uploaded ${successCount} file(s) successfully.\n${failCount} file(s) failed:\n${errors.join(
          "\n"
        )}`,
        variant: "warning",
      });
    } else if (failCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Upload Failed",
        message: `Failed to upload files`,
        variant: "error",
      });
    }

    // Reset input
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const handleCreateNote = async () => {
    const newNote = await createNote({
      title: "New Note",
      content: "",
      folderId: currentFolderId || undefined,
    });
    router.push(`/note/${newNote.id}`);
  };

  const handleNoteClick = (note: Note) => {
    router.push(`/note/${note.id}`);
  };

  const handleAddLink = async () => {
    setPromptModal({
      isOpen: true,
      title: "Add Link",
      message: "Enter the URL you want to save:",
      placeholder: "https://example.com",
      onSubmit: async (url) => {
        try {
          // Validate URL
          new URL(url);
          // Add link with current folder context
          const newLink = await addLink(url);
          // If we're in a folder, update the link with the folder ID
          if (currentFolderId && newLink) {
            await updateLink(newLink.id, { folderId: currentFolderId });
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          setAlertModal({
            isOpen: true,
            title: "Invalid URL",
            message: "Please enter a valid URL",
            variant: "error",
          });
        }
      },
    });
  };

  const handleNoteDelete = async (note: Note) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Note",
      message: `Are you sure you want to delete "${note.title}"?`,
      onConfirm: async () => {
        await deleteNote(note.id);
      },
      variant: "danger",
    });
  };

  const handlePhotoDelete = async (photo: Photo) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Photo",
      message: `Are you sure you want to delete "${photo.title}"?`,
      onConfirm: async () => {
        await deletePhoto(photo.id);
      },
      variant: "danger",
    });
  };

  const handleLinkDelete = async (link: Link) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Link",
      message: `Are you sure you want to delete "${link.title}"?`,
      onConfirm: async () => {
        await deleteLink(link.id);
      },
      variant: "danger",
    });
  };

  const handleFileDelete = async (file: FileType) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete File",
      message: `Are you sure you want to delete "${file.name}"?`,
      onConfirm: async () => {
        await deleteFile(file.id);
      },
      variant: "danger",
    });
  };

  const handleLinkRefreshMetadata = async (link: Link) => {
    try {
      await refreshLinkMetadata(link);
    } catch (error) {
      console.error("Failed to refresh metadata:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to refresh metadata. Please try again.",
        variant: "error",
      });
    }
  };

  // Edit handlers
  const handleNoteEdit = (note: Note) => {
    setEditCardModal({
      isOpen: true,
      item: note,
      type: "note",
    });
  };

  const handlePhotoEdit = (photo: Photo) => {
    setEditCardModal({
      isOpen: true,
      item: photo,
      type: "photo",
    });
  };

  const handleLinkEdit = (link: Link) => {
    setEditCardModal({
      isOpen: true,
      item: link,
      type: "link",
    });
  };

  const handleFileEdit = (file: FileType) => {
    setEditCardModal({
      isOpen: true,
      item: file,
      type: "file",
    });
  };

  const handleFolderEdit = (folder: Folder) => {
    setEditFolderModal({
      isOpen: true,
      folder,
    });
    setFolderContextMenu(null);
  };

  const handleCardSave = async (
    id: string,
    updates: Partial<Note | Photo | Link | FileType>
  ) => {
    try {
      if (editCardModal.type === "note") {
        await updateNote(id, updates as Partial<Note>);
      } else if (editCardModal.type === "photo") {
        await updatePhoto(id, updates as Partial<Photo>);
      } else if (editCardModal.type === "link") {
        await updateLink(id, updates as Partial<Link>);
      } else if (editCardModal.type === "file") {
        await updateFile(id, updates as Partial<FileType>);
      }
      setEditCardModal({ isOpen: false, item: null, type: null });
    } catch (error) {
      console.error("Failed to update:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to save changes. Please try again.",
        variant: "error",
      });
    }
  };

  const handleFolderSave = async (id: string, updates: Partial<Folder>) => {
    try {
      await updateFolder(id, updates);
      setEditFolderModal({ isOpen: false, folder: null });
    } catch (error) {
      console.error("Failed to update folder:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to save folder changes. Please try again.",
        variant: "error",
      });
    }
  };

  const handleFolderCreate = async (name: string, labelIds: string[]) => {
    try {
      await createFolder({
        name,
        parentId: currentFolderId || undefined,
        labelIds: labelIds.length > 0 ? labelIds : undefined,
      });
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFolderDelete = async (folder: any) => {
    const noteCount = notes.filter((n) => n.folderId === folder.id).length;
    const photoCount = photos.filter((p) => p.folderId === folder.id).length;
    const linkCount = links.filter((l) => l.folderId === folder.id).length;
    const totalItems = noteCount + photoCount + linkCount;

    const message =
      totalItems > 0
        ? `Delete folder "${folder.name}" and its ${totalItems} item(s) (${noteCount} notes, ${photoCount} photos, ${linkCount} links)?`
        : `Delete folder "${folder.name}"?`;

    setConfirmModal({
      isOpen: true,
      title: "Delete Folder",
      message,
      onConfirm: async () => {
        await deleteFolder(folder.id, true);
        if (currentFolderId === folder.id) {
          setCurrentFolderId(null);
        }
      },
      variant: "danger",
    });
  };

  const handleFolderClick = (folderId: string) => {
    // Enter the folder
    setCurrentFolderId(folderId);
  };

  const handleNoteDragStart = (note: Note) => {
    setDraggedNote(note);
  };

  const handlePhotoDragStart = (photo: Photo) => {
    setDraggedPhoto(photo);
  };

  const handleLinkDragStart = (link: Link) => {
    setDraggedLink(link);
  };

  const handleFileDragStart = (file: FileType) => {
    setDraggedFile(file);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
    setDraggedPhoto(null);
    setDraggedLink(null);
    setDraggedFile(null);
  };

  const handleItemDrop = async (
    itemId: string,
    folderId: string | null,
    itemType: "note" | "photo" | "link" | "file" | "folder"
  ) => {
    if (itemType === "note") {
      await updateNote(itemId, { folderId: folderId || undefined });
    } else if (itemType === "photo") {
      await updatePhoto(itemId, { folderId: folderId || undefined });
    } else if (itemType === "link") {
      await updateLink(itemId, { folderId: folderId || undefined });
    } else if (itemType === "file") {
      await updateFile(itemId, { folderId: folderId || undefined });
    } else if (itemType === "folder") {
      // Check for circular nesting
      const targetFolder = folders.find((f) => f.id === folderId);
      const sourceFolder = folders.find((f) => f.id === itemId);

      if (!targetFolder || !sourceFolder) return;

      // Prevent circular nesting: check if target is a descendant of source
      let checkId: string | null | undefined = targetFolder.parentId;
      while (checkId) {
        if (checkId === itemId) {
          // Circular nesting detected!
          setAlertModal({
            isOpen: true,
            title: "Invalid Move",
            message: "Cannot move a folder into its own subfolder.",
            variant: "warning",
          });
          return;
        }
        const parent = folders.find((f) => f.id === checkId);
        checkId = parent?.parentId;
      }

      // Move folder by updating parentId
      await updateFolder(itemId, { parentId: folderId || undefined });
    }

    // Refresh the view if needed
    if (currentFolderId !== null && folderId !== currentFolderId) {
      if (itemType === "note") {
        setFilteredNotes((prev) => prev.filter((n) => n.id !== itemId));
      } else if (itemType === "photo") {
        setFilteredPhotos((prev) => prev.filter((p) => p.id !== itemId));
      } else if (itemType === "link") {
        setFilteredLinks((prev) => prev.filter((l) => l.id !== itemId));
      } else if (itemType === "file") {
        setFilteredFiles((prev) => prev.filter((f) => f.id !== itemId));
      }
      // Note: folders will automatically update via state management
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: Folder) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent background context menu from showing
    setFolderContextMenu({ x: e.clientX, y: e.clientY, folder });
  };

  const handleEditLabels = () => {
    if (!folderContextMenu) return;
    setSelectedFolder(folderContextMenu.folder);
    setEditingLabelIds(folderContextMenu.folder.labelIds || []);
    setIsLabelModalOpen(true);
    setFolderContextMenu(null);
  };

  const handleSaveLabels = async () => {
    if (!selectedFolder) return;
    try {
      await updateFolder(selectedFolder.id, {
        labelIds: editingLabelIds.length > 0 ? editingLabelIds : undefined,
      });
      setIsLabelModalOpen(false);
      setSelectedFolder(null);
      setEditingLabelIds([]);
    } catch (error) {
      console.error("Failed to update folder labels:", error);
    }
  };

  const handleCancelLabelEdit = () => {
    setIsLabelModalOpen(false);
    setSelectedFolder(null);
    setEditingLabelIds([]);
  };

  const handleCreateLabel = async () => {
    setPromptModal({
      isOpen: true,
      title: "Create Label",
      message: "Enter a name for the new label:",
      placeholder: "Label name",
      onSubmit: async (labelName) => {
        try {
          const newLabel = await createLabel({
            name: labelName.trim(),
            color: `#${Math.floor(Math.random() * 16777215)
              .toString(16)
              .padStart(6, "0")}`, // Random color
          });
          // Auto-select the newly created label
          setEditingLabelIds((prev) => [...prev, newLabel.id]);
        } catch (error) {
          console.error("Failed to create label:", error);
          setAlertModal({
            isOpen: true,
            title: "Error",
            message: "Failed to create label. Please try again.",
            variant: "error",
          });
        }
      },
    });
  };

  // Global dropzone handlers
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging files from desktop (not internal drag-drop)
    if (e.dataTransfer.types.includes("Files")) {
      setDragCounter((prev) => prev + 1);
      setIsDraggingFiles(true);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDraggingFiles(false);
      }
      return newCount;
    });
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingFiles(false);
    setDragCounter(0);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    let photoCount = 0;
    let fileCount = 0;
    let failCount = 0;

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];

      try {
        // Route images to photos, everything else to files
        if (file.type.startsWith("image/")) {
          await uploadPhoto(file, currentFolderId || undefined);
          photoCount++;
        } else {
          await uploadFile(file, currentFolderId || undefined);
          fileCount++;
        }
      } catch (error) {
        console.error("Failed to upload:", error);
        failCount++;
      }
    }

    // Show success/error alerts
    if (photoCount > 0 || fileCount > 0) {
      const messages = [];
      if (photoCount > 0)
        messages.push(`${photoCount} photo${photoCount > 1 ? "s" : ""}`);
      if (fileCount > 0)
        messages.push(`${fileCount} file${fileCount > 1 ? "s" : ""}`);

      setAlertModal({
        isOpen: true,
        title: "Upload Successful",
        message: `Uploaded ${messages.join(" and ")} successfully!`,
        variant: "success",
      });
    }

    if (failCount > 0) {
      setAlertModal({
        isOpen: true,
        title: "Upload Failed",
        message: `Failed to upload ${failCount} file${
          failCount > 1 ? "s" : ""
        }. Please try again.`,
        variant: "error",
      });
    }
  };

  // Background context menu handlers
  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Always prevent default browser context menu

    // Check if clicking on a card or interactive element
    const target = e.target as HTMLElement;

    // Don't show context menu if clicking on cards or interactive elements
    const isCard = target.closest(
      'article, button, a, input, textarea, [class*="Card"]'
    );

    if (isCard) {
      return; // Let the card's context menu handle it
    }

    // Show background context menu
    setBackgroundContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div
      className="min-h-screen"
      onContextMenu={handleBackgroundContextMenu}
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center justify-between h-16">
            <Image src={Logo} alt="Ooozzy" height={60} />

            <SearchBar
              onSearch={handleSearch}
              placeholder="Search..."
              className="w-full hidden sm:block"
            />

            <div className="flex items-center justify-end">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                ref={documentInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <AddNewDropdown
                onAddNote={handleCreateNote}
                onAddPhoto={() => fileInputRef.current?.click()}
                onAddLink={handleAddLink}
                onAddFolder={() => setIsCreateFolderModalOpen(true)}
                onAddFile={() => documentInputRef.current?.click()}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search..."
          className="w-full"
        />
      </div>

      {/* Main Content */}
      <main className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentFolderId ? (
          // Inside a folder - show breadcrumb, subfolders, and content
          <>
            {/* Breadcrumb Navigation */}
            <div className="mb-6">
              <Breadcrumb
                items={buildBreadcrumbs(currentFolderId)}
                onNavigate={setCurrentFolderId}
              />
            </div>

            {/* Subfolders Grid */}
            {getVisibleFolders().length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <Typography
                    variant="h4"
                    className="font-semibold text-gray-700"
                  >
                    Folders
                  </Typography>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getVisibleFolders().map((folder, index) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <FolderCard
                        folder={folder}
                        notes={notes.filter((n) => n.folderId === folder.id)}
                        photos={photos.filter((p) => p.folderId === folder.id)}
                        links={links.filter((l) => l.folderId === folder.id)}
                        subfolders={folders.filter(
                          (f) => f.parentId === folder.id
                        )}
                        onClick={() => handleFolderClick(folder.id)}
                        onDelete={() => handleFolderDelete(folder)}
                        onDrop={handleItemDrop}
                        onContextMenu={(e) =>
                          handleFolderContextMenu(e, folder)
                        }
                        isActive={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Info */}
            {searchQuery && (
              <div className="mb-6">
                <Typography variant="body" className="text-gray-600">
                  {filteredNotes.length +
                    filteredPhotos.length +
                    filteredLinks.length}{" "}
                  result
                  {filteredNotes.length +
                    filteredPhotos.length +
                    filteredLinks.length !== 1 // prettier-ignore
                    ? "s"
                    : ""}{" "}
                  for &quot;{searchQuery}&quot;
                </Typography>
              </div>
            )}

            {/* Unified Content Grid */}
            <ContentGrid
              notes={filteredNotes}
              photos={filteredPhotos}
              links={filteredLinks}
              files={filteredFiles}
              folders={folders}
              labels={labels}
              loadingMetadataIds={loadingMetadataIds}
              onNoteClick={handleNoteClick}
              onNoteDelete={handleNoteDelete}
              onPhotoDelete={handlePhotoDelete}
              onLinkDelete={handleLinkDelete}
              onFileDelete={handleFileDelete}
              onNoteUpdate={updateNote}
              onPhotoUpdate={updatePhoto}
              onLinkUpdate={updateLink}
              onFileUpdate={updateFile}
              onNoteEdit={handleNoteEdit}
              onPhotoEdit={handlePhotoEdit}
              onLinkEdit={handleLinkEdit}
              onFileEdit={handleFileEdit}
              onLinkRefreshMetadata={handleLinkRefreshMetadata}
              onNoteDragStart={handleNoteDragStart}
              onPhotoDragStart={handlePhotoDragStart}
              onLinkDragStart={handleLinkDragStart}
              onFileDragStart={handleFileDragStart}
              onDragEnd={handleDragEnd}
              onMoveToFolder={handleItemDrop}
              onCreateNote={handleCreateNote}
              loading={loading}
            />
          </>
        ) : (
          // Root level - show folders and unfiled notes
          <>
            {/* Folders Grid */}
            <div className="pb-4">
              <div className="mb-4">
                <Typography variant="h3" className="font-semibold">
                  Folders
                </Typography>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getVisibleFolders().map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <FolderCard
                      folder={folder}
                      notes={notes.filter((n) => n.folderId === folder.id)}
                      photos={photos.filter((p) => p.folderId === folder.id)}
                      links={links.filter((l) => l.folderId === folder.id)}
                      subfolders={folders.filter(
                        (f) => f.parentId === folder.id
                      )}
                      onClick={() => handleFolderClick(folder.id)}
                      onDelete={() => handleFolderDelete(folder)}
                      onDrop={handleItemDrop}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                      isActive={false}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <hr />

            {/* Unfiled Notes Section */}
            <div className="pt-4">
              {/* Search Results Info */}
              {searchQuery && (
                <div className="mb-6">
                  <Typography variant="body" className="text-gray-600">
                    {filteredNotes.length +
                      filteredPhotos.length +
                      filteredLinks.length}{" "}
                    result
                    {filteredNotes.length +
                      filteredPhotos.length +
                      filteredLinks.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    for &quot;{searchQuery}&quot;
                  </Typography>
                </div>
              )}

              {/* Unified Content Grid */}
              <ContentGrid
                notes={filteredNotes}
                photos={filteredPhotos}
                links={filteredLinks}
                files={filteredFiles}
                folders={folders}
                labels={labels}
                loadingMetadataIds={loadingMetadataIds}
                onNoteClick={handleNoteClick}
                onNoteDelete={handleNoteDelete}
                onPhotoDelete={handlePhotoDelete}
                onLinkDelete={handleLinkDelete}
                onFileDelete={handleFileDelete}
                onNoteUpdate={updateNote}
                onPhotoUpdate={updatePhoto}
                onLinkUpdate={updateLink}
                onFileUpdate={updateFile}
                onNoteEdit={handleNoteEdit}
                onPhotoEdit={handlePhotoEdit}
                onLinkEdit={handleLinkEdit}
                onFileEdit={handleFileEdit}
                onLinkRefreshMetadata={handleLinkRefreshMetadata}
                onNoteDragStart={handleNoteDragStart}
                onPhotoDragStart={handlePhotoDragStart}
                onLinkDragStart={handleLinkDragStart}
                onFileDragStart={handleFileDragStart}
                onDragEnd={handleDragEnd}
                onMoveToFolder={handleItemDrop}
                onCreateNote={handleCreateNote}
                loading={loading}
              />
            </div>
          </>
        )}
      </main>

      {/* Folder Context Menu */}
      {folderContextMenu && (
        <ContextMenu
          x={folderContextMenu.x}
          y={folderContextMenu.y}
          onClose={() => setFolderContextMenu(null)}
        >
          <ContextMenuItem
            onClick={() => handleFolderEdit(folderContextMenu.folder)}
          >
            <div className="flex items-center gap-2">
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
              Edit Folder
            </div>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleEditLabels}>
            <div className="flex items-center gap-2">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Edit Labels
            </div>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              handleFolderDelete(folderContextMenu.folder);
              setFolderContextMenu(null);
            }}
            className="text-red-600 hover:bg-red-50"
          >
            <div className="flex items-center gap-2">
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
              Delete Folder
            </div>
          </ContextMenuItem>
        </ContextMenu>
      )}

      {/* Label Assignment Modal */}
      <Modal
        isOpen={isLabelModalOpen}
        handleClose={handleCancelLabelEdit}
        title={`Edit Labels - ${selectedFolder?.name || ""}`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={handleCancelLabelEdit} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveLabels} variant="primary">
              Save Labels
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <LabelSelector
            selectedLabelIds={editingLabelIds}
            onSelectionChange={setEditingLabelIds}
            onCreateNew={handleCreateLabel}
          />
        </div>
      </Modal>

      {/* Reusable Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Delete"
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onSubmit={promptModal.onSubmit}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        defaultValue={promptModal.defaultValue}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Edit Modals */}
      <EditCardModal
        isOpen={editCardModal.isOpen}
        onClose={() =>
          setEditCardModal({ isOpen: false, item: null, type: null })
        }
        item={editCardModal.item}
        type={editCardModal.type as "note" | "photo" | "link" | "file"}
        onSave={handleCardSave}
      />

      <EditFolderModal
        isOpen={editFolderModal.isOpen}
        onClose={() => setEditFolderModal({ isOpen: false, folder: null })}
        folder={editFolderModal.folder}
        onSave={handleFolderSave}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSave={handleFolderCreate}
      />

      {/* Global Dropzone Overlay */}
      <DropzoneOverlay isActive={isDraggingFiles} />

      {/* Background Context Menu */}
      {backgroundContextMenu && (
        <ContextMenu
          x={backgroundContextMenu.x}
          y={backgroundContextMenu.y}
          onClose={() => setBackgroundContextMenu(null)}
        >
          <ContextMenuItem onClick={handleCreateNote}>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              <span>Note</span>
            </div>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span>Photo</span>
            </div>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleAddLink}>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
              <span>Link</span>
            </div>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => documentInputRef.current?.click()}>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <span>Upload</span>
            </div>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => setIsCreateFolderModalOpen(true)}>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                />
              </svg>
              <span>Folder</span>
            </div>
          </ContextMenuItem>
        </ContextMenu>
      )}
    </div>
  );
};
