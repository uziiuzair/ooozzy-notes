/**
 * Event System Configuration
 *
 * Centralizes all configuration for the event system
 * Separates dev and production behavior
 *
 * @module events/config
 */

export const EventConfig = {
  /**
   * Current environment
   */
  isDev: process.env.NODE_ENV === "development",

  /**
   * Event History Persistence (dev only)
   * Stores event history in localStorage for debugging across page reloads
   */
  persistence: {
    enabled: process.env.NODE_ENV === "development",
    key: "ooozzy-events-history",
    limit: 100, // Store last 100 events
  },

  /**
   * Circuit Breaker Configuration
   * Automatically disables failing listeners to prevent error loops
   */
  circuitBreaker: {
    maxFailures: 5, // Disable listener after 5 consecutive failures
    resetTimeout: 30000, // Reset failure count after 30 seconds
  },

  /**
   * Performance Monitoring
   * Tracks event emission times and warns about slow listeners
   */
  performance: {
    warnSlowListeners: true, // Warn about listeners that take too long
    slowThreshold: 10, // Threshold in milliseconds (>10ms = slow)
    trackEmitTime: process.env.NODE_ENV === "development",
  },

  /**
   * Debugging Configuration
   * Controls logging and debugging output
   */
  debug: {
    logEmits: process.env.NODE_ENV === "development", // Log all emitted events
    logListeners: false, // Log listener additions/removals (verbose)
    logErrors: true, // Log listener errors
  },

  /**
   * Memory Management
   * Prevents memory leaks from too many listeners
   */
  memory: {
    maxListenersPerEvent: 100, // Warn if >100 listeners for single event
    warnOnHighListenerCount: true,
  },

  /**
   * Visual Debugger Configuration
   * Settings for the dev-only visual debugger component
   */
  debugger: {
    enabled: process.env.NODE_ENV === "development",
    position: "bottom-right" as const, // Position of debugger panel
    defaultMinimized: true, // Start minimized
    maxDisplayedEvents: 50, // Max events to show in UI
    enableKeyboardShortcuts: true, // Enable keyboard shortcuts
    shortcuts: {
      toggle: "ctrl+shift+e", // Toggle debugger visibility
      clear: "ctrl+shift+c", // Clear event history
    },
  },
} as const;

/**
 * Type-safe config access
 */
export type EventConfigType = typeof EventConfig;
