/**
 * useEventEmitter Hook
 *
 * React hook to emit events from any component
 * Returns a stable emit function that won't cause re-renders
 *
 * @module events/hooks/useEventEmitter
 */

"use client";

import { useCallback } from "react";
import { EventBus } from "../EventBus";
import type { EventName, EventData } from "../types";

/**
 * Hook to emit events from any component
 *
 * Returns a stable callback that can be safely used in dependency arrays
 * SSR-safe: Silently no-ops on server
 *
 * @example
 * function NoteEditor() {
 *   const emit = useEventEmitter();
 *
 *   const handleSave = () => {
 *     emit('note:created', { noteId, folderId, title, timestamp: Date.now() });
 *   };
 *
 *   return <button onClick={handleSave}>Save Note</button>;
 * }
 *
 * @example
 * // Emit with typed data
 * const emit = useEventEmitter();
 * emit('note:created', {
 *   noteId: 'note_123',
 *   folderId: 'folder_456',
 *   title: 'My New Note',
 *   timestamp: Date.now()
 * });
 *
 * @returns Emit function with type-safe event names and data
 */
export function useEventEmitter() {
  return useCallback(<E extends EventName>(event: E, data: EventData<E>) => {
    // SSR guard - silently no-op on server
    if (typeof window === "undefined") return;

    // Emit event through EventBus
    EventBus.getInstance().emit(event, data);
  }, []); // Empty deps - function is stable across renders
}
