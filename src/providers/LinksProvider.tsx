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

interface LinksContextType {
  links: Link[];
  addLink: (url: string) => Promise<Link>;
  updateLink: (id: string, updates: Partial<Link>) => void;
  deleteLink: (id: string) => void;
  deleteLinksInFolder: (folderId: string) => void;
  togglePinLink: (id: string) => void;
  moveLinksToFolder: (linkIds: string[], folderId: string | null) => void;
  fetchLinkMetadata: (url: string) => Promise<LinkMetadata>;
}

const LinksContext = createContext<LinksContextType | undefined>(undefined);

export function LinksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);

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

        // Fetch screenshot using Puppeteer service
        try {
          const screenshotResponse = await fetch(
            `https://noodleseed-puppeteer.creativelog.workers.dev/?url=${encodeURIComponent(
              url
            )}`
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

      // Fetch screenshot in background and update
      fetchLinkMetadata(url).then((metadata) => {
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
      });

      return newLink;
    },
    [links, fetchLinkMetadata]
  );

  const updateLink = useCallback((id: string, updates: Partial<Link>) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, ...updates, updatedAt: new Date() } : link
      )
    );
  }, []);

  const deleteLink = useCallback((id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

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
    },
    []
  );

  return (
    <LinksContext.Provider
      value={{
        links,
        addLink,
        updateLink,
        deleteLink,
        deleteLinksInFolder,
        togglePinLink,
        moveLinksToFolder,
        fetchLinkMetadata,
      }}
    >
      {children}
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
