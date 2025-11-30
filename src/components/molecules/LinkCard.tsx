"use client";

import React, { useState } from "react";
import { Link } from "@/types/link";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";

interface LinkCardProps {
  link: Link;
  isSelected?: boolean;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function LinkCard({
  link,
  isSelected = false,
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
          <span className="text-xs">📌</span>
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
            {/* Show loading animation if no image yet but also no error */}
            {!link.image && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Loading spinner */}
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 opacity-30"></div>
                  </div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
                </div>
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

            {/* Loading text */}
            {!link.image && !imageError && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Loading preview...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <Typography
          variant="h4"
          className="font-semibold mb-1 line-clamp-2 text-sm"
        >
          {link.title}
        </Typography>

        {link.description && (
          <Typography
            variant="body"
            className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 text-xs"
          >
            {link.description}
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
