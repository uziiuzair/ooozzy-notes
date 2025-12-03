"use client";

import React from "react";
import { File } from "@/types/file";
import { Label } from "@/types/label";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { LabelBadge } from "@/components/molecules/LabelBadge";
import { cn } from "@/lib/utils";

interface FileCardProps {
  file: File;
  labels?: Label[];
  isSelected?: boolean;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// File type icon component
const FileTypeIcon = ({ fileType }: { fileType: File["fileType"] }) => {
  const iconClasses = "w-12 h-12";

  switch (fileType) {
    case "document":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={cn(iconClasses, "text-blue-500")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      );
    case "video":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={cn(iconClasses, "text-purple-500")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      );
    case "audio":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={cn(iconClasses, "text-green-500")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z"
          />
        </svg>
      );
    case "archive":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={cn(iconClasses, "text-orange-500")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={cn(iconClasses, "text-gray-500")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      );
  }
};

export function FileCard({
  file,
  labels = [],
  isSelected = false,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: FileCardProps) {
  const fileLabels = file.labelIds
    ? labels.filter((l) => file.labelIds!.includes(l.id))
    : [];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "file",
        id: file.id,
      })
    );
    onDragStart?.(e);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(file.url, "_blank");
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:-translate-y-1",
        "bg-white",
        isSelected && "ring-2 ring-blue-500"
      )}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Pin indicator */}
      {file.isPinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3 h-3 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5l14 14m-9-9v6m4.5-7.5l-4.5 4.5"
            />
          </svg>
        </div>
      )}

      <div>
        {/* File Type Icon */}
        <div className="flex justify-center mb-4">
          <FileTypeIcon fileType={file.fileType} />
        </div>

        {/* File Name */}
        <Typography
          variant="body"
          className="font-medium text-gray-900 line-clamp-2 text-center mb-2 min-h-[3rem]"
        >
          {file.name}
        </Typography>

        {/* File Size & Type Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 uppercase">
            {file.fileType}
          </span>
        </div>

        {/* Video Player for video files */}
        {file.fileType === "video" && (
          <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
            <video
              src={file.url}
              controls
              className="w-full"
              style={{ maxHeight: "200px" }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download
        </button>

        {/* Labels */}
        {fileLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {fileLabels.map((label) => (
              <LabelBadge key={label.id} label={label} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
