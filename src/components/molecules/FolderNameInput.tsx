"use client";

import { FC, useState, useEffect, useRef, KeyboardEvent } from "react";

interface FolderNameInputProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  initialValue?: string;
  placeholder?: string;
}

export const FolderNameInput: FC<FolderNameInputProps> = ({
  onConfirm,
  onCancel,
  initialValue = "",
  placeholder = "Folder name...",
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const trimmedValue = value.trim();
    if (trimmedValue.length > 0 && trimmedValue.length <= 50) {
      onConfirm(trimmedValue);
    } else if (trimmedValue.length === 0) {
      onCancel(); // Cancel if empty
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Confirm on blur (unless empty, then cancel)
    handleConfirm();
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={50}
        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 focus:border-electric-violet focus:ring-2 focus:ring-electric-violet/20 outline-none transition-all duration-200 min-w-[200px]"
        aria-label="Folder name"
      />
      {value.length > 0 && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {value.length}/50
        </span>
      )}
    </div>
  );
};
