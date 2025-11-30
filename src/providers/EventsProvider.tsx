/**
 * EventsProvider - React Context for Event System
 *
 * Provides event system access throughout the app via React Context
 * Initializes EventBus singleton and exposes hooks-friendly API
 *
 * @module providers/EventsProvider
 */

"use client";

import {
  createContext,
  useContext,
  ReactNode,
  FC,
  useCallback,
  useMemo,
} from "react";
import { EventBus } from "@/lib/events/EventBus";
import type { EventName, EventData, EventListener } from "@/lib/events/types";

/**
 * Events Context Type
 * Provides emit, on, off methods and event system utilities
 */
interface EventsContextType {
  /** Emit an event with type-safe data */
  emit: <E extends EventName>(event: E, data: EventData<E>) => void;

  /** Subscribe to an event */
  on: <E extends EventName>(event: E, listener: EventListener<E>) => () => void;

  /** Unsubscribe from an event */
  off: <E extends EventName>(event: E, listener: EventListener<E>) => void;

  /** Get event system metrics (dev only) */
  getMetrics: () => ReturnType<EventBus["getMetrics"]>;

  /** Clear event history (dev only) */
  clearHistory: () => void;
}

/**
 * Events Context
 * Provides global event system access
 */
export const EventsContext = createContext<EventsContextType | null>(null);

/**
 * EventsProvider Props
 */
interface EventsProviderProps {
  children: ReactNode;
}

/**
 * EventsProvider Component
 *
 * Wraps app to provide event system access via context
 * Should be the outermost provider in AppProvider
 *
 * @example
 * // In AppProvider
 * <EventsProvider>
 *   <NotesProvider>
 *     <FoldersProvider>
 *       {children}
 *     </FoldersProvider>
 *   </NotesProvider>
 * </EventsProvider>
 */
export const EventsProvider: FC<EventsProviderProps> = ({ children }) => {
  // Get EventBus singleton instance
  const eventBus = useMemo(() => EventBus.getInstance(), []);

  // Stable emit function
  const emit = useCallback(
    <E extends EventName>(event: E, data: EventData<E>) => {
      eventBus.emit(event, data);
    },
    [eventBus]
  );

  // Stable on function
  const on = useCallback(
    <E extends EventName>(event: E, listener: EventListener<E>) => {
      return eventBus.on(event, listener);
    },
    [eventBus]
  );

  // Stable off function
  const off = useCallback(
    <E extends EventName>(event: E, listener: EventListener<E>) => {
      eventBus.off(event, listener);
    },
    [eventBus]
  );

  // Get metrics function (dev only)
  const getMetrics = useCallback(() => {
    return eventBus.getMetrics();
  }, [eventBus]);

  // Clear history function (dev only)
  const clearHistory = useCallback(() => {
    eventBus.clearHistory();
  }, [eventBus]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      emit,
      on,
      off,
      getMetrics,
      clearHistory,
    }),
    [emit, on, off, getMetrics, clearHistory]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
};

/**
 * useEventsContext Hook
 *
 * Access events context from any component
 * Throws error if used outside EventsProvider
 *
 * @example
 * const { emit } = useEventsContext();
 * emit('note:created', { noteId, folderId, title, timestamp });
 */
export const useEventsContext = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEventsContext must be used within EventsProvider");
  }
  return context;
};
