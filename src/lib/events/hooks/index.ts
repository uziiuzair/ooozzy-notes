/**
 * Event System Hooks - Barrel Export
 *
 * Centralized export for all event hooks
 *
 * @module events/hooks
 */

export { useEventEmitter } from "./useEventEmitter";
export { useEventListener } from "./useEventListener";
export {
  useEventHistory,
  type UseEventHistoryOptions,
  type EventHistoryResult,
} from "./useEventHistory";
