"use client";

import { FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContentGrid } from "@/components/organisms/ContentGrid";
import { FolderCard } from "@/components/molecules/FolderCard";
import { FolderNameInput } from "@/components/molecules/FolderNameInput";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { useNotes } from "@/hooks/useNotes";
import { usePhotos } from "@/providers/PhotosProvider";
import { useLinks } from "@/providers/LinksProvider";
import { useFolders } from "@/hooks/useFolders";
import { Note } from "@/types/note";
import { Photo } from "@/types/photo";
import { Link } from "@/types/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Logo from "../../../public/Logo.svg";

export const DashboardTemplate: FC = () => {
  const router = useRouter();
  const { notes, loading, createNote, deleteNote, searchNotes, updateNote } =
    useNotes();
  const { photos, uploadPhoto, deletePhoto, updatePhoto, getPhotosByFolder } =
    usePhotos();
  const { links, addLink, deleteLink, updateLink } = useLinks();
  const { folders, createFolder, deleteFolder } = useFolders();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [, setDraggedNote] = useState<Note | null>(null);
  const [, setDraggedPhoto] = useState<Photo | null>(null);
  const [, setDraggedLink] = useState<Link | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [notes, photos, links, currentFolderId, getPhotosByFolder]);

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
      } else {
        setFilteredNotes(notes.filter((note) => !note.folderId));
        setFilteredPhotos(photos.filter((photo) => !photo.folderId));
        setFilteredLinks(links.filter((link) => !link.folderId));
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
      alert(
        `Uploaded ${successCount} photo(s) successfully.\n${failCount} photo(s) failed:\n${errors.join(
          "\n"
        )}`
      );
    } else if (failCount > 0) {
      alert(
        `Failed to upload photos:\n${errors.join(
          "\n"
        )}\n\nTip: If you're seeing storage quota errors, try clearing some existing photos or using smaller images.`
      );
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    const url = prompt("Enter URL:");
    if (url) {
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
        alert("Please enter a valid URL");
      }
    }
  };

  const handleNoteDelete = async (note: Note) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(note.id);
    }
  };

  const handlePhotoDelete = async (photo: Photo) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      await deletePhoto(photo.id);
    }
  };

  const handleLinkDelete = async (link: Link) => {
    if (confirm("Are you sure you want to delete this link?")) {
      await deleteLink(link.id);
    }
  };

  const handleFolderCreate = async (name: string) => {
    try {
      await createFolder({ name });
      setIsCreatingFolder(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
      setIsCreatingFolder(false);
    }
  };

  const handleFolderCreateCancel = () => {
    setIsCreatingFolder(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFolderDelete = async (folder: any) => {
    const noteCount = notes.filter((n) => n.folderId === folder.id).length;
    const message =
      noteCount > 0
        ? `Delete folder "${folder.name}" and its ${noteCount} notes?`
        : `Delete folder "${folder.name}"?`;

    if (confirm(message)) {
      await deleteFolder(folder.id, true);
      if (currentFolderId === folder.id) {
        setCurrentFolderId(null);
      }
    }
  };

  const handleFolderClick = (folderId: string) => {
    // Enter the folder
    setCurrentFolderId(folderId);
  };

  const handleBackToRoot = () => {
    // Exit the folder
    setCurrentFolderId(null);
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

  const handleDragEnd = () => {
    setDraggedNote(null);
    setDraggedPhoto(null);
    setDraggedLink(null);
  };

  const handleItemDrop = async (
    itemId: string,
    folderId: string | null,
    itemType: "note" | "photo" | "link"
  ) => {
    if (itemType === "note") {
      await updateNote(itemId, { folderId: folderId || undefined });
    } else if (itemType === "photo") {
      await updatePhoto(itemId, { folderId: folderId || undefined });
    } else {
      await updateLink(itemId, { folderId: folderId || undefined });
    }

    // Refresh the view if needed
    if (currentFolderId !== null && folderId !== currentFolderId) {
      if (itemType === "note") {
        setFilteredNotes((prev) => prev.filter((n) => n.id !== itemId));
      } else if (itemType === "photo") {
        setFilteredPhotos((prev) => prev.filter((p) => p.id !== itemId));
      } else {
        setFilteredLinks((prev) => prev.filter((l) => l.id !== itemId));
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center justify-between h-16">
            <Image src={Logo} alt="Ooozzy" height={60} />

            <SearchBar
              onSearch={handleSearch}
              placeholder="Search..."
              className="w-full hidden sm:block"
            />

            <div className="flex items-center justify-end">
              <Button onClick={handleCreateNote} variant="ghost" size="sm">
                <div className="flex items-center gap-2.5">
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>Note</span>
                </div>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
              >
                <div className="flex items-center gap-2.5">
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>Photo</span>
                </div>
              </Button>
              <Button onClick={handleAddLink} variant="ghost" size="sm">
                <div className="flex items-center gap-2.5">
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>Link</span>
                </div>
              </Button>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentFolderId ? (
          // Inside a folder - show folder header and notes
          <>
            {/* Folder Header with Back Button */}
            <div className="mb-6 flex items-center gap-4">
              <Button onClick={handleBackToRoot} variant="ghost" size="sm">
                ← Back
              </Button>
              <Typography variant="h3" className="font-semibold">
                {folders.find((f) => f.id === currentFolderId)?.name ||
                  "Folder"}
              </Typography>
            </div>

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
              folders={folders}
              onNoteClick={handleNoteClick}
              onNoteDelete={handleNoteDelete}
              onPhotoDelete={handlePhotoDelete}
              onLinkDelete={handleLinkDelete}
              onNoteUpdate={updateNote}
              onPhotoUpdate={updatePhoto}
              onLinkUpdate={updateLink}
              onNoteDragStart={handleNoteDragStart}
              onPhotoDragStart={handlePhotoDragStart}
              onLinkDragStart={handleLinkDragStart}
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
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h3" className="font-semibold">
                  Folders
                </Typography>
                {isCreatingFolder ? (
                  <FolderNameInput
                    onConfirm={handleFolderCreate}
                    onCancel={handleFolderCreateCancel}
                    placeholder="Folder name..."
                  />
                ) : (
                  <Button
                    onClick={() => setIsCreatingFolder(true)}
                    variant="secondary"
                    size="sm"
                  >
                    <div className="flex items-center gap-2.5">
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
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>

                      <span>New Folder</span>
                    </div>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {folders.map((folder, index) => (
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
                      onClick={() => handleFolderClick(folder.id)}
                      onDelete={() => handleFolderDelete(folder)}
                      onDrop={handleItemDrop}
                      isActive={false}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Unfiled Notes Section */}
            <div>
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
                folders={folders}
                onNoteClick={handleNoteClick}
                onNoteDelete={handleNoteDelete}
                onPhotoDelete={handlePhotoDelete}
                onLinkDelete={handleLinkDelete}
                onNoteUpdate={updateNote}
                onPhotoUpdate={updatePhoto}
                onLinkUpdate={updateLink}
                onNoteDragStart={handleNoteDragStart}
                onPhotoDragStart={handlePhotoDragStart}
                onLinkDragStart={handleLinkDragStart}
                onDragEnd={handleDragEnd}
                onMoveToFolder={handleItemDrop}
                onCreateNote={handleCreateNote}
                loading={loading}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};
