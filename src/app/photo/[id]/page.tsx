"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { usePhotos } from "@/providers/PhotosProvider";
import { Photo } from "@/types/photo";

export default function PhotoPage() {
  const router = useRouter();
  const params = useParams();
  const photoId = params.id as string;

  const { photos, updatePhoto, deletePhoto } = usePhotos();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCaption, setEditedCaption] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const currentPhoto = photos.find((p) => p.id === photoId);
    if (currentPhoto) {
      setPhoto(currentPhoto);
      setEditedTitle(currentPhoto.title);
      setEditedCaption(currentPhoto.caption || "");
      setEditedTags(currentPhoto.tags || []);
    }
  }, [photoId, photos]);

  const handleSave = async () => {
    if (!photo) return;

    await updatePhoto(photo.id, {
      title: editedTitle,
      caption: editedCaption,
      tags: editedTags,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!photo) return;

    if (confirm("Are you sure you want to delete this photo?")) {
      await deletePhoto(photo.id);
      router.push("/");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Typography variant="h3">Photo not found</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[95rem]  mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button onClick={() => router.push("/")} variant="ghost" size="sm">
              ← Back
            </Button>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} variant="primary" size="sm">
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button onClick={handleDelete} variant="danger" size="sm">
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[95rem]  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Photo Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-auto"
                  style={{ maxHeight: "80vh", objectFit: "contain" }}
                />
              }
            </div>
          </div>

          {/* Photo Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {isEditing ? (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caption
                      </label>
                      <textarea
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Add a caption..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleAddTag()
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Add a tag..."
                        />
                        <Button
                          onClick={handleAddTag}
                          variant="ghost"
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <Typography variant="h2" className="font-bold mb-2">
                    {photo.title}
                  </Typography>

                  {photo.caption && (
                    <Typography variant="body" className="text-gray-600 mb-4">
                      {photo.caption}
                    </Typography>
                  )}

                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {photo.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Photo Info */}
                  <div className="space-y-3 text-sm text-gray-600">
                    {photo.width && photo.height && (
                      <div className="flex justify-between">
                        <span className="font-medium">Dimensions:</span>
                        <span>
                          {photo.width} × {photo.height}
                        </span>
                      </div>
                    )}
                    {photo.size && (
                      <div className="flex justify-between">
                        <span className="font-medium">Size:</span>
                        <span>{formatFileSize(photo.size)}</span>
                      </div>
                    )}
                    {photo.mimeType && (
                      <div className="flex justify-between">
                        <span className="font-medium">Type:</span>
                        <span>{photo.mimeType}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Uploaded:</span>
                      <span>
                        {new Date(photo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {photo.updatedAt !== photo.createdAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">Modified:</span>
                        <span>
                          {new Date(photo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pin Status */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      onClick={() =>
                        updatePhoto(photo.id, { isPinned: !photo.isPinned })
                      }
                      variant={photo.isPinned ? "secondary" : "ghost"}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                      </svg>
                      {photo.isPinned ? "Pinned" : "Pin Photo"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
