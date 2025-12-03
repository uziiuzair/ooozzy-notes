"use client";

import { FC, ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { EventsProvider } from "./EventsProvider";
import { NotesProvider } from "./NotesProvider";
import { FoldersProvider } from "./FoldersProvider";
import { PhotosProvider } from "./PhotosProvider";
import { LinksProvider } from "./LinksProvider";
import { LabelsProvider } from "./LabelsProvider";
import { FilesProvider } from "./FilesProvider";

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <EventsProvider>
        <LabelsProvider>
          <FoldersProvider>
            <NotesProvider>
              <PhotosProvider>
                <LinksProvider>
                  <FilesProvider>{children}</FilesProvider>
                </LinksProvider>
              </PhotosProvider>
            </NotesProvider>
          </FoldersProvider>
        </LabelsProvider>
      </EventsProvider>
    </AuthProvider>
  );
};
