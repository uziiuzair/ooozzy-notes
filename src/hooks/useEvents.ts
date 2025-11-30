/**
 * useEvents Hook
 *
 * Convenience hook to access event system
 * Re-exports useEventsContext for cleaner imports
 *
 * @module hooks/useEvents
 */

"use client";

import { useEventsContext } from "@/providers/EventsProvider";

/**
 * Hook to access event system from any component
 *
 * Provides emit, on, off methods and event system utilities
 * Follows the same pattern as useNotes, useFolders, etc.
 *
 * @example
 * function NoteEditor() {
 *   const { emit } = useEvents();
 *
 *   const handleSave = () => {
 *     emit('note:created', {
 *       noteId: note.id,
 *       folderId: note.folderId,
 *       title: note.title,
 *       timestamp: Date.now()
 *     });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 *
 * @example
 * // Subscribe to events
 * const { on } = useEvents();
 * useEffect(() => {
 *   return on('note:created', (data) => {
 *     console.log('Note created:', data);
 *   });
 * }, [on]);
 *
 * @returns Event system context with emit, on, off, getMetrics, clearHistory
 */
export const useEvents = useEventsContext;
