/**
 * Event System - Main Barrel Export
 *
 * Centralized export for the entire event system
 * Provides easy access to all event system components
 *
 * @module events
 */

// Core
export { EventBus, eventBus } from "./EventBus";
export { EventConfig } from "./config";

// Types
export type {
  AppEvents,
  EventName,
  EventData,
  EventListener,
  WildcardListener,
  EventHistoryEntry,
  CircuitBreakerState,
} from "./types";

// Hooks
export {
  useEventEmitter,
  useEventListener,
  useEventHistory,
  type UseEventHistoryOptions,
  type EventHistoryResult,
} from "./hooks";

// Re-export EventDebugger for convenience
export { EventDebugger } from "@/components/organisms/EventDebugger";
