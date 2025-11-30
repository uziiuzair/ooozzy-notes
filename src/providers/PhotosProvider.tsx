"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Photo, PhotoInput, PhotoUpdate } from "@/types/photo";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface PhotosContextType {
  photos: Photo[];
  addPhoto: (photo: PhotoInput) => Promise<Photo>;
  updatePhoto: (id: string, updates: PhotoUpdate) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  getPhotosByFolder: (folderId: string) => Photo[];
  uploadPhoto: (file: File, folderId?: string) => Promise<Photo>;
}

const PhotosContext = createContext<PhotosContextType | undefined>(undefined);

export function PhotosProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Load photos from storage on mount and when auth state changes
  useEffect(() => {
    const loadPhotos = async () => {
      const adapter = getStorageAdapter(user?.uid);
      const storedPhotos = await adapter.getPhotos();
      setPhotos(storedPhotos);
    };
    loadPhotos();
  }, [user]);

  const addPhoto = async (photoInput: PhotoInput): Promise<Photo> => {
    const newPhoto: Photo = {
      ...photoInput,
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);
    const adapter = getStorageAdapter(user?.uid);
    await adapter.savePhotos(updatedPhotos);
    return newPhoto;
  };

  const updatePhoto = async (
    id: string,
    updates: PhotoUpdate
  ): Promise<void> => {
    const updatedPhotos = photos.map((photo) =>
      photo.id === id
        ? { ...photo, ...updates, updatedAt: new Date().toISOString() }
        : photo
    );
    setPhotos(updatedPhotos);
    const adapter = getStorageAdapter(user?.uid);
    await adapter.savePhotos(updatedPhotos);
  };

  const deletePhoto = async (id: string): Promise<void> => {
    const updatedPhotos = photos.filter((photo) => photo.id !== id);
    setPhotos(updatedPhotos);
    const adapter = getStorageAdapter(user?.uid);
    await adapter.savePhotos(updatedPhotos);
  };

  const getPhotosByFolder = (folderId: string): Photo[] => {
    return photos.filter((photo) => photo.folderId === folderId);
  };

  const compressImage = (
    dataUrl: string,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.7
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () =>
        reject(new Error("Failed to load image for compression"));
      img.src = dataUrl;
    });
  };

  const uploadPhoto = async (file: File, folderId?: string): Promise<Photo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const originalDataUrl = e.target?.result as string;

          // Create image element to get dimensions
          const img = new Image();
          img.onload = async () => {
            try {
              // Compress the main image (max 1200px wide/tall, 70% quality)
              const compressedUrl = await compressImage(
                originalDataUrl,
                1200,
                1200,
                0.7
              );

              // Create a smaller thumbnail (max 400px wide/tall, 60% quality)
              const thumbnailUrl = await compressImage(
                originalDataUrl,
                400,
                400,
                0.6
              );

              const photo = await addPhoto({
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                url: compressedUrl,
                thumbnailUrl: thumbnailUrl,
                caption: "",
                tags: [],
                isPinned: false,
                width: img.width,
                height: img.height,
                size: file.size,
                mimeType: file.type,
                folderId,
              });
              resolve(photo);
            } catch (compressionError) {
              console.error("Compression failed:", compressionError);
              // If compression fails, try to save without compression but warn user
              if (file.size > 500000) {
                // 500KB
                reject(
                  new Error(
                    "Image too large. Please use a smaller image (under 500KB)."
                  )
                );
              } else {
                const photo = await addPhoto({
                  title: file.name.replace(/\.[^/.]+$/, ""),
                  url: originalDataUrl,
                  thumbnailUrl: originalDataUrl,
                  caption: "",
                  tags: [],
                  isPinned: false,
                  width: img.width,
                  height: img.height,
                  size: file.size,
                  mimeType: file.type,
                  folderId,
                });
                resolve(photo);
              }
            }
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = originalDataUrl;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  return (
    <PhotosContext.Provider
      value={{
        photos,
        addPhoto,
        updatePhoto,
        deletePhoto,
        getPhotosByFolder,
        uploadPhoto,
      }}
    >
      {children}
    </PhotosContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotosContext);
  if (context === undefined) {
    throw new Error("usePhotos must be used within a PhotosProvider");
  }
  return context;
}
