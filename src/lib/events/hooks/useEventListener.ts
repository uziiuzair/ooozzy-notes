/**
 * useEventListener Hook
 *
 * React hook to subscribe to events
 * Automatically cleans up on unmount
 *
 * @module events/hooks/useEventListener
 */

"use client";

import { useEffect, useRef } from "react";
import { EventBus } from "../EventBus";
import type { EventName, EventListener } from "../types";

/**
 * Hook to subscribe to events
 *
 * Automatically subscribes on mount and unsubscribes on unmount
 * SSR-safe: Silently no-ops on server
 *
 * @example
 * function NotificationPanel() {
 *   useEventListener('note:created', (data) => {
 *     showToast(`Note created: ${data.title}`);
 *   }, []);
 *
 *   return <div>Notifications</div>;
 * }
 *
 * @example
 * // With dependencies
 * useEventListener('note:updated', async (data) => {
 *   if (data.noteId === currentNoteId) {
 *     await refreshNote();
 *   }
 * }, [currentNoteId, refreshNote]);
 *
 * @param event - Event name to listen to
 * @param listener - Callback function (can be async)
 * @param deps - Dependency array (like useEffect)
 */
export function useEventListener<E extends EventName>(
  event: E,
  listener: EventListener<E>,
  deps: React.DependencyList = []
): void {
  // Use ref to store latest listener without re-subscribing
  const listenerRef = useRef(listener);

  // Update ref when listener changes
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    const eventBus = EventBus.getInstance();

    // Create stable wrapper that calls latest listener
    const wrappedListener: EventListener<E> = (data) => {
      return listenerRef.current(data);
    };

    // Subscribe to event
    const unsubscribe = eventBus.on(event, wrappedListener);

    // Cleanup on unmount
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]); // Re-subscribe when event or deps change
}
