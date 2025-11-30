"use client";

import { FC, useState, useEffect } from "react";
import { Modal } from "@/components/molecules/Modal";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Note } from "@/types/note";
import { Link } from "@/types/link";
import { Photo } from "@/types/photo";
import { Label } from "@/types/label";
import { LabelBadge } from "@/components/molecules/LabelBadge";

type ContentItem = Note | Link | Photo;

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem | null;
  type: "note" | "link" | "photo";
  labels?: Label[];
  onSave: (id: string, updates: Partial<ContentItem>) => void;
}

export const EditCardModal: FC<EditCardModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  labels = [],
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Initialize form with item data
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setSelectedLabelIds(item.labelIds || []);
      if (type === "link" && "url" in item) {
        setUrl(item.url);
      }
      if (type === "photo" && "url" in item) {
        setPhotoPreview(item.url);
      }
    } else {
      // Reset form when modal closes
      setTitle("");
      setUrl("");
      setPhotoFile(null);
      setPhotoPreview("");
      setSelectedLabelIds([]);
    }
  }, [item, type]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = () => {
    if (!item) return;

    const updates: Partial<ContentItem> = {
      title,
      labelIds: selectedLabelIds,
    };

    if (type === "link") {
      (updates as Partial<Link>).url = url;
    }

    if (type === "photo" && photoPreview && photoPreview !== (item as Photo).url) {
      (updates as Partial<Photo>).url = photoPreview;
    }

    onSave(item.id, updates);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      handleClose={onClose}
      title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title Input */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Enter ${type} title`}
          className="rounded-lg"
        />

        {/* Link URL Input */}
        {type === "link" && (
          <Input
            label="URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="rounded-lg"
          />
        )}

        {/* Photo Upload/Replace */}
        {type === "photo" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replace Photo
            </label>

            {/* Current/Preview Photo */}
            {photoPreview && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* File Input */}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Select a new image to replace the current photo
            </p>
          </div>
        )}

        {/* Label Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labels
          </label>

          {labels.length === 0 ? (
            <p className="text-sm text-gray-500">No labels available</p>
          ) : (
            <div className="space-y-2">
              {labels.map((label) => (
                <label
                  key={label.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedLabelIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <LabelBadge label={label} size="sm" />
                </label>
              ))}
            </div>
          )}

          {/* Selected Labels Preview */}
          {selectedLabelIds.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Selected labels:</p>
              <div className="flex flex-wrap gap-1.5">
                {labels
                  .filter((l) => selectedLabelIds.includes(l.id))
                  .map((label) => (
                    <LabelBadge key={label.id} label={label} size="sm" />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
