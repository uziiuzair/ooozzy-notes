"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Link, LinkMetadata } from "@/types/link";
import { getStorageAdapter } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { useEvents } from "@/hooks/useEvents";
import { classifyContent } from "@/lib/ai/labelClassifier";
import { useLabels } from "@/hooks/useLabels";
import { useFolders } from "@/hooks/useFolders";
import { FolderSuggestionModal } from "@/components/molecules/FolderSuggestionModal";

interface LinksContextType {
  links: Link[];
  loadingMetadataIds: Set<string>;
  addLink: (url: string) => Promise<Link>;
  updateLink: (id: string, updates: Partial<Link>) => void;
  deleteLink: (id: string) => void;
  deleteLinksInFolder: (folderId: string) => void;
  togglePinLink: (id: string) => void;
  moveLinksToFolder: (linkIds: string[], folderId: string | null) => void;
  fetchLinkMetadata: (url: string) => Promise<LinkMetadata>;
  refreshLinkMetadata: (link: Link) => Promise<void>;
}

const LinksContext = createContext<LinksContextType | undefined>(undefined);

export function LinksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loadingMetadataIds, setLoadingMetadataIds] = useState<Set<string>>(new Set());
  const { emit } = useEvents();
  const { labels, createLabel } = useLabels();
  const { folders } = useFolders();

  // Folder suggestion modal state
  const [folderSuggestion, setFolderSuggestion] = useState<{
    linkId: string;
    folderName: string;
    folderId: string;
  } | null>(null);

  // Load links from storage on mount and when auth state changes
  useEffect(() => {
    const loadLinks = async () => {
      const adapter = getStorageAdapter(user?.uid);
      const storedLinks = await adapter.getLinks();
      // Convert date strings back to Date objects
      const parsedLinks = storedLinks.map((link) => ({
        ...link,
        createdAt: new Date(link.createdAt),
        updatedAt: new Date(link.updatedAt),
      }));
      setLinks(parsedLinks);
    };
    loadLinks();
  }, [user]);

  // Save links to storage whenever they change
  useEffect(() => {
    if (links.length === 0) return; // Skip initial empty state

    const saveLinks = async () => {
      const adapter = getStorageAdapter(user?.uid);
      // Convert Date objects to strings for storage
      const linksToStore = links.map((link) => ({
        ...link,
        createdAt:
          link.createdAt instanceof Date
            ? link.createdAt.toISOString()
            : link.createdAt,
        updatedAt:
          link.updatedAt instanceof Date
            ? link.updatedAt.toISOString()
            : link.updatedAt,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await adapter.saveLinks(linksToStore as any);
    };
    saveLinks();
  }, [links, user]);

  const fetchLinkMetadata = useCallback(
    async (url: string): Promise<LinkMetadata> => {
      try {
        // Extract domain from URL
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace("www.", "");

        // Basic metadata
        const metadata: LinkMetadata = {
          title: domain,
          domain: domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        };

        // Fetch screenshot using our API proxy (avoids CORS issues)
        try {
          const screenshotResponse = await fetch(
            `/api/screenshot?url=${encodeURIComponent(url)}`
          );

          if (screenshotResponse.ok) {
            const screenshotData = await screenshotResponse.json();
            if (screenshotData.url) {
              metadata.image = screenshotData.url;
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          console.log("Could not fetch screenshot, continuing without it");
        }

        // Try to get better title from the page (optional API endpoint)
        try {
          const response = await fetch(
            `/api/metadata?url=${encodeURIComponent(url)}`
          );
          if (response.ok) {
            const data = await response.json();
            return { ...metadata, ...data };
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // API not available, use defaults
        }

        return metadata;
      } catch (error) {
        console.error("Error parsing URL:", error);
        // Fallback for invalid URLs
        return {
          title: url,
          domain: "link",
          favicon: undefined,
        };
      }
    },
    []
  );

  const addLink = useCallback(
    async (url: string): Promise<Link> => {
      // Validate URL
      let urlObj;
      try {
        urlObj = new URL(url);
      } catch {
        throw new Error("Invalid URL");
      }

      // Check if link already exists
      if (links.some((link) => link.url === url)) {
        throw new Error("Link already exists");
      }

      // Extract domain immediately
      const domain = urlObj.hostname.replace("www.", "");

      // Create link immediately with basic info
      const newLink: Link = {
        id: Date.now().toString(),
        url,
        title: domain, // Use domain as initial title
        description: undefined,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        image: undefined, // No image initially
        domain: domain,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      };

      // Add link immediately
      setLinks((prev) => [...prev, newLink]);

      // Emit event
      emit("link:captured", {
        linkId: newLink.id,
        url: newLink.url,
        domain: newLink.domain,
        timestamp: Date.now(),
      });

      // Mark as loading
      setLoadingMetadataIds((prev) => new Set(prev).add(newLink.id));

      // Fetch screenshot in background and update
      fetchLinkMetadata(url)
        .then((metadata) => {
          setLinks((prev) =>
            prev.map((link) =>
              link.id === newLink.id
                ? {
                    ...link,
                    title: metadata.title || link.title,
                    description: metadata.description,
                    image: metadata.image,
                    updatedAt: new Date(),
                  }
                : link
            )
          );

          // AI label classification (async, non-blocking) - run after metadata is fetched
          if (user && !newLink.labelIds) {
            classifyContent({
              content: metadata.description || "",
              title: metadata.title || newLink.title,
              type: "link",
              existingLabels: labels,
            })
              .then(async (result) => {
                if (result.suggestedLabelIds.length === 0 && result.newLabels.length === 0) {
                  return; // No suggestions
                }

                // Create new labels first
                const createdLabelIds: string[] = [];
                for (const newLabelInput of result.newLabels) {
                  try {
                    const createdLabel = await createLabel(newLabelInput);
                    createdLabelIds.push(createdLabel.id);
                  } catch (err) {
                    console.error("Failed to create suggested label:", err);
                  }
                }

                const allSuggestedLabelIds = [...result.suggestedLabelIds, ...createdLabelIds];
                if (allSuggestedLabelIds.length === 0) return;

                // Auto-apply labels immediately
                try {
                  const adapter = getStorageAdapter(user?.uid);
                  await adapter.updateLink(newLink.id, { labelIds: allSuggestedLabelIds });
                  setLinks((prev) =>
                    prev.map((link) =>
                      link.id === newLink.id ? { ...link, labelIds: allSuggestedLabelIds } : link
                    )
                  );

                  // Check for folder suggestions
                  const matchingFolder = folders.find(f =>
                    f.labelIds?.some(id => allSuggestedLabelIds.includes(id))
                  );
                  if (matchingFolder && !newLink.folderId) {
                    setFolderSuggestion({
                      linkId: newLink.id,
                      folderName: matchingFolder.name,
                      folderId: matchingFolder.id,
                    });
                  }
                } catch (err) {
                  console.error("Failed to auto-apply labels:", err);
                }
              })
              .catch((err) => {
                console.error("AI classification failed:", err);
              });
          }
        })
        .finally(() => {
          // Remove from loading state
          setLoadingMetadataIds((prev) => {
            const next = new Set(prev);
            next.delete(newLink.id);
            return next;
          });
        });

      return newLink;
    },
    [links, fetchLinkMetadata, emit, user, labels, createLabel, folders]
  );

  const updateLink = useCallback(async (id: string, updates: Partial<Link>) => {
    // Optimistically update UI
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, ...updates, updatedAt: new Date() } : link
      )
    );

    // Persist to storage
    try {
      const adapter = getStorageAdapter(user?.uid);
      await adapter.updateLink(id, updates);

      // Emit event
      const updatedLink = links.find((l) => l.id === id);
      if (updatedLink) {
        emit("link:updated", {
          linkId: id,
          folderId: updatedLink.folderId || null,
          fieldsUpdated: Object.keys(updates),
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Failed to update link:", error);
      // Reload links to restore state on error
      const adapter = getStorageAdapter(user?.uid);
      const storedLinks = await adapter.getLinks();
      const parsedLinks = storedLinks.map((link) => ({
        ...link,
        createdAt: new Date(link.createdAt),
        updatedAt: new Date(link.updatedAt),
      }));
      setLinks(parsedLinks);
      throw error;
    }
  }, [user, links, emit]);

  const deleteLink = useCallback(async (id: string) => {
    // Optimistically update UI
    setLinks((prev) => prev.filter((link) => link.id !== id));

    // Persist to storage
    try {
      const adapter = getStorageAdapter(user?.uid);
      await adapter.deleteLink(id);

      // Emit event
      emit("link:deleted", {
        linkId: id,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to delete link:", error);
      // Reload links to restore state on error
      const adapter = getStorageAdapter(user?.uid);
      const storedLinks = await adapter.getLinks();
      const parsedLinks = storedLinks.map((link) => ({
        ...link,
        createdAt: new Date(link.createdAt),
        updatedAt: new Date(link.updatedAt),
      }));
      setLinks(parsedLinks);
      throw error;
    }
  }, [user, emit]);

  const deleteLinksInFolder = useCallback((folderId: string) => {
    setLinks((prev) => prev.filter((link) => link.folderId !== folderId));
  }, []);

  const togglePinLink = useCallback((id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? { ...link, isPinned: !link.isPinned, updatedAt: new Date() }
          : link
      )
    );
  }, []);

  const moveLinksToFolder = useCallback(
    (linkIds: string[], folderId: string | null) => {
      // Get old folder IDs before moving for events
      const movingLinks = links.filter((link) => linkIds.includes(link.id));

      setLinks((prev) =>
        prev.map((link) =>
          linkIds.includes(link.id)
            ? {
                ...link,
                folderId: folderId || undefined,
                updatedAt: new Date(),
              }
            : link
        )
      );

      // Emit event for each moved link
      movingLinks.forEach((link) => {
        emit("link:moved", {
          linkId: link.id,
          fromFolderId: link.folderId || null,
          toFolderId: folderId,
          timestamp: Date.now(),
        });
      });
    },
    [links, emit]
  );

  const refreshLinkMetadata = useCallback(
    async (link: Link) => {
      // Mark as loading
      setLoadingMetadataIds((prev) => new Set(prev).add(link.id));

      try {
        const metadata = await fetchLinkMetadata(link.url);
        await updateLink(link.id, {
          title: metadata.title || link.title,
          description: metadata.description,
          favicon: metadata.favicon,
          image: metadata.image,
          domain: metadata.domain || link.domain,
        });
      } finally {
        // Remove from loading state
        setLoadingMetadataIds((prev) => {
          const next = new Set(prev);
          next.delete(link.id);
          return next;
        });
      }
    },
    [fetchLinkMetadata, updateLink]
  );

  const handleMoveToFolder = useCallback(async () => {
    if (!folderSuggestion) return;

    const adapter = getStorageAdapter(user?.uid);
    await adapter.updateLink(folderSuggestion.linkId, {
      folderId: folderSuggestion.folderId,
    });
    setLinks((prev) =>
      prev.map((link) =>
        link.id === folderSuggestion.linkId
          ? { ...link, folderId: folderSuggestion.folderId }
          : link
      )
    );
  }, [folderSuggestion, user]);

  return (
    <LinksContext.Provider
      value={{
        links,
        loadingMetadataIds,
        addLink,
        updateLink,
        deleteLink,
        deleteLinksInFolder,
        togglePinLink,
        moveLinksToFolder,
        fetchLinkMetadata,
        refreshLinkMetadata,
      }}
    >
      {children}
      <FolderSuggestionModal
        isOpen={!!folderSuggestion}
        folderName={folderSuggestion?.folderName || ""}
        onMove={handleMoveToFolder}
        onDismiss={() => setFolderSuggestion(null)}
      />
    </LinksContext.Provider>
  );
}

export function useLinks() {
  const context = useContext(LinksContext);
  if (context === undefined) {
    throw new Error("useLinks must be used within a LinksProvider");
  }
  return context;
}
