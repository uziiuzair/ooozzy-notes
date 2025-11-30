/**
 * useEventHistory Hook
 *
 * React hook to access event history for debugging
 * Only works in development mode
 *
 * @module events/hooks/useEventHistory
 */

"use client";

import { useState, useEffect } from "react";
import { EventBus } from "../EventBus";
import { EventConfig } from "../config";
import type { EventHistoryEntry } from "../types";

/**
 * Options for event history
 */
export interface UseEventHistoryOptions {
  /**
   * Maximum number of events to store
   * @default 50
   */
  limit?: number;

  /**
   * Auto-refresh history when new events arrive
   * @default true
   */
  autoRefresh?: boolean;
}

/**
 * Return type for useEventHistory hook
 */
export interface EventHistoryResult {
  /** Array of event history entries */
  events: EventHistoryEntry[];

  /** Clear all event history */
  clear: () => void;

  /** Manually refresh history from EventBus */
  refresh: () => void;

  /** Total number of events (including those not in current limit) */
  totalCount: number;
}

/**
 * Hook to access event history for debugging
 *
 * Only works in development mode
 * Returns empty array in production
 *
 * @example
 * function DebugPanel() {
 *   const { events, clear } = useEventHistory({ limit: 50 });
 *
 *   return (
 *     <div>
 *       <button onClick={clear}>Clear History</button>
 *       {events.map(event => (
 *         <div key={event.id}>
 *           {event.event}: {JSON.stringify(event.data)}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Console debugging
 * const { events } = useEventHistory();
 * console.table(events);
 *
 * @param options - History options
 * @returns Event history and control functions
 */
export function useEventHistory(
  options: UseEventHistoryOptions = {}
): EventHistoryResult {
  const { limit = 50, autoRefresh = true } = options;

  const [events, setEvents] = useState<EventHistoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Load initial history
  useEffect(() => {
    // Only in dev mode
    if (!EventConfig.isDev) {
      setEvents([]);
      setTotalCount(0);
      return;
    }

    // SSR guard
    if (typeof window === "undefined") return;

    const eventBus = EventBus.getInstance();

    // Load initial history
    const history = eventBus.getHistory(limit);
    setEvents(history);
    setTotalCount(history.length);
  }, [limit]);

  // Subscribe to new events (if autoRefresh enabled)
  useEffect(() => {
    if (!EventConfig.isDev || !autoRefresh) return;
    if (typeof window === "undefined") return;

    const eventBus = EventBus.getInstance();

    // Subscribe to all events using wildcard listener
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = eventBus.on("*" as any, () => {
      // Get updated history
      const history = eventBus.getHistory(limit);
      setEvents(history);
      setTotalCount(history.length);
    });

    return unsubscribe;
  }, [limit, autoRefresh]);

  // Clear history function
  const clear = () => {
    if (!EventConfig.isDev) return;
    if (typeof window === "undefined") return;

    EventBus.getInstance().clearHistory();
    setEvents([]);
    setTotalCount(0);
  };

  // Manual refresh function
  const refresh = () => {
    if (!EventConfig.isDev) return;
    if (typeof window === "undefined") return;

    const eventBus = EventBus.getInstance();
    const history = eventBus.getHistory(limit);
    setEvents(history);
    setTotalCount(history.length);
  };

  return {
    events,
    clear,
    refresh,
    totalCount,
  };
}
