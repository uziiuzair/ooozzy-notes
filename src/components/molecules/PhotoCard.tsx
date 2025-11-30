"use client";

import React, { useState } from "react";
import { Photo } from "@/types/photo";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { useRouter } from "next/navigation";

interface PhotoCardProps {
  photo: Photo;
  onDelete?: (id: string) => void;
  onEdit?: (photo: Photo) => void;
  onDragStart?: (photo: Photo) => void;
  onDragEnd?: () => void;
}

export function PhotoCard({
  photo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDelete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEdit,
  onDragStart,
  onDragEnd,
}: PhotoCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    router.push(`/photo/${photo.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Context menu will be handled by parent component
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "photo",
        id: photo.id,
        title: photo.title,
      })
    );
    onDragStart?.(photo);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Pin indicator */}
      {photo.isPinned && (
        <div className="absolute top-2 right-2 z-10">
          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16a1 1 0 11-2 0V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </div>
        </div>
      )}

      {/* Image container with aspect ratio */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded-xl">
        {!imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              className="w-16 h-16 text-gray-400"
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
          </div>
        )}

        {/* Overlay with photo info on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            {photo.width && photo.height && (
              <Typography variant="caption" className="text-white/80">
                {photo.width} × {photo.height}
              </Typography>
            )}
            {photo.size && (
              <Typography variant="caption" className="text-white/80 ml-2">
                {formatFileSize(photo.size)}
              </Typography>
            )}
          </div>
        </div>
      </div>

      {/* Photo details */}
      <div className="pt-4 flex flex-col gap-2">
        <Typography variant="h4" className="font-semibold truncate text-base">
          {photo.title}
        </Typography>

        {photo.caption && (
          <Typography
            variant="body"
            className="text-gray-600 line-clamp-2 mb-2 text-sm"
          >
            {photo.caption}
          </Typography>
        )}

        {/* Tags */}
        {photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
            {photo.tags.length > 3 && (
              <Badge variant="secondary" size="sm">
                +{photo.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Date */}
        <Typography variant="caption" className="text-gray-500 block">
          {new Date(photo.createdAt).toLocaleDateString()}
        </Typography>
      </div>
    </Card>
  );
}
