"use client";

import React, { useState } from "react";
import { Link } from "@/types/link";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { LoadingBars } from "@/components/atoms/LoadingBars";
import { cn } from "@/lib/utils";

interface LinkCardProps {
  link: Link;
  isSelected?: boolean;
  isLoadingMetadata?: boolean;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function LinkCard({
  link,
  isSelected = false,
  isLoadingMetadata = false,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: LinkCardProps) {
  const [imageError, setImageError] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      // Open link in new tab
      window.open(link.url, "_blank");
    } else {
      onSelect?.();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "link",
        id: link.id,
        url: link.url,
      })
    );
    onDragStart?.(e);
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:shadow-lg",
        "bg-white dark:bg-gray-800",
        isSelected && "ring-2 ring-blue-500 shadow-lg"
      )}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Pin indicator */}
      {link.isPinned && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center z-10">
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

      {/* Preview image or favicon */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg overflow-hidden">
        {link.image && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.image}
            alt={link.title}
            className="w-full h-full object-cover object-top"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            {/* Show loading animation while metadata is being fetched */}
            {isLoadingMetadata && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                <LoadingBars label="loading preview" size="md" />
              </div>
            )}

            {/* Favicon display */}
            {link.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.favicon}
                alt={link.domain}
                className="w-16 h-16 object-contain z-10"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <svg
                className="w-12 h-12 text-gray-400 z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}

            {/* No preview message - only show when loading is complete and no image */}
            {!isLoadingMetadata && !link.image && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 z-10">
                No preview available
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3">
        <Typography
          variant="h4"
          className="font-semibold mb-1 line-clamp-2 text-sm"
        >
          {link.title
            .replace(/&#x27;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")}
        </Typography>

        {link.description && (
          <Typography
            variant="body"
            className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 text-xs"
          >
            {link.description
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")}
          </Typography>
        )}

        <div className="flex items-center gap-2 mt-2">
          {link.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.favicon}
              alt=""
              className="w-4 h-4 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <Badge variant="secondary" className="text-xs">
            {link.domain}
          </Badge>
        </div>
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors rounded-lg pointer-events-none" />
    </Card>
  );
}
