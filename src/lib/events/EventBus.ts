/**
 * EventBus - Production-Grade Global Event System
 *
 * Singleton event bus with type-safe events, error isolation,
 * circuit breaker pattern, and performance monitoring.
 *
 * Features:
 * - Type-safe event emission and listening
 * - Automatic error isolation (listener errors don't crash app)
 * - Circuit breaker (auto-disable failing listeners)
 * - Performance monitoring (warn on slow listeners)
 * - Memory management (WeakMap references, automatic cleanup)
 * - SSR-safe (client-only operations)
 * - Event history (dev only, persisted to localStorage)
 *
 * @module events/EventBus
 */

import { EventConfig } from "./config";
import type {
  EventName,
  EventData,
  EventListener,
  WildcardListener,
  EventHistoryEntry,
  CircuitBreakerState,
} from "./types";

/**
 * Core EventBus Implementation
 * Singleton pattern ensures single instance across the app
 */
export class EventBus {
  private static instance: EventBus | null = null;

  // Event listeners storage
  private listeners: Map<EventName, Set<EventListener<any>>> = new Map(); // eslint-disable-line @typescript-eslint/no-explicit-any
  private wildcardListeners: Set<WildcardListener> = new Set();

  // Circuit breaker state per listener
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private circuitBreakers: WeakMap<Function, CircuitBreakerState> = new WeakMap(); // prettier-ignore

  // Event history for debugging (dev only)
  private history: EventHistoryEntry[] = [];
  private historyCounter = 0;

  // Performance tracking
  private metrics = {
    totalEvents: 0,
    totalErrors: 0,
    slowEvents: 0,
  };

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {
    // Load history from localStorage (dev only)
    if (EventConfig.persistence.enabled && typeof window !== "undefined") {
      this.loadHistoryFromStorage();
    }

    // Initialize system
    if (EventConfig.debug.logEmits) {
      console.log("[EventBus] Initialized");
    }

    // Emit system initialized event
    setTimeout(() => {
      this.emit("system:initialized", {
        timestamp: Date.now(),
        environment: EventConfig.isDev ? "development" : "production",
      });
    }, 0);
  }

  /**
   * Get singleton instance
   * Lazy initialization - no overhead until first use
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Emit an event with type-safe data
   *
   * @example
   * emit('note:created', { noteId: '123', folderId: '456', title: 'My Note', timestamp: Date.now() });
   */
  public emit<E extends EventName>(event: E, data: EventData<E>): void {
    // SSR guard
    if (typeof window === "undefined") return;

    // Performance tracking
    const startTime = EventConfig.performance.trackEmitTime
      ? performance.now()
      : 0;
    this.metrics.totalEvents++;

    // Debug logging
    if (EventConfig.debug.logEmits) {
      console.log(`[EventBus] Emit: ${event}`, data);
    }

    // Add to history (dev only)
    if (EventConfig.persistence.enabled) {
      this.addToHistory(event, data);
    }

    // Call specific event listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        this.callListener(event, listener, data);
      });
    }

    // Call wildcard listeners
    if (this.wildcardListeners.size > 0) {
      this.wildcardListeners.forEach((listener) => {
        this.callWildcardListener(event, listener, data);
      });
    }

    // Performance monitoring
    if (EventConfig.performance.trackEmitTime) {
      const duration = performance.now() - startTime;
      if (duration > EventConfig.performance.slowThreshold) {
        this.metrics.slowEvents++;
        if (EventConfig.performance.warnSlowListeners) {
          console.warn(
            `[EventBus] Slow event emission: ${event} took ${duration.toFixed(2)}ms`
          );
        }
      }
    }
  }

  /**
   * Subscribe to an event
   *
   * @example
   * const unsubscribe = on('note:created', (data) => {
   *   console.log('New note:', data.noteId);
   * });
   * // Later: unsubscribe();
   */
  // Overload for wildcard listener
  public on(event: "*", listener: WildcardListener): () => void;
  // Overload for specific event
  public on<E extends EventName>(
    event: E,
    listener: EventListener<E>
  ): () => void;
  // Implementation
  public on<E extends EventName>(
    event: E | "*",
    listener: EventListener<E> | WildcardListener
  ): () => void {
    // SSR guard
    if (typeof window === "undefined") return () => {};

    // Wildcard listener
    if (event === "*") {
      this.wildcardListeners.add(listener as WildcardListener);

      if (EventConfig.debug.logListeners) {
        console.log("[EventBus] Added wildcard listener");
      }

      // Return unsubscribe function
      return () => {
        this.wildcardListeners.delete(listener as WildcardListener);
      };
    }

    // Get or create listener set for this event
    if (!this.listeners.has(event as E)) {
      this.listeners.set(event as E, new Set());
    }

    const eventListeners = this.listeners.get(event as E)!;
    eventListeners.add(listener as EventListener<E>);

    // Warn if too many listeners
    if (
      EventConfig.memory.warnOnHighListenerCount &&
      eventListeners.size > EventConfig.memory.maxListenersPerEvent
    ) {
      console.warn(
        `[EventBus] High listener count for ${event}: ${eventListeners.size} listeners`
      );
    }

    if (EventConfig.debug.logListeners) {
      console.log(
        `[EventBus] Added listener for ${event} (total: ${eventListeners.size})`
      );
    }

    // Return unsubscribe function
    return () => {
      this.off(event as E, listener as EventListener<E>);
    };
  }

  /**
   * Unsubscribe from an event
   */
  // Overload for wildcard listener
  public off(event: "*", listener: WildcardListener): void;
  // Overload for specific event
  public off<E extends EventName>(event: E, listener: EventListener<E>): void;
  // Implementation
  public off<E extends EventName>(
    event: E | "*",
    listener: EventListener<E> | WildcardListener
  ): void {
    // SSR guard
    if (typeof window === "undefined") return;

    // Wildcard listener
    if (event === "*") {
      this.wildcardListeners.delete(listener as WildcardListener);
      return;
    }

    const eventListeners = this.listeners.get(event as E);
    if (eventListeners) {
      eventListeners.delete(listener as EventListener<E>);

      // Clean up empty sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }

      if (EventConfig.debug.logListeners) {
        console.log(`[EventBus] Removed listener for ${event}`);
      }
    }
  }

  /**
   * Remove all listeners for an event (or all events)
   */
  public removeAllListeners(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.wildcardListeners.clear();
    }
  }

  /**
   * Get event history (dev only)
   */
  public getHistory(limit?: number): EventHistoryEntry[] {
    if (!EventConfig.persistence.enabled) return [];

    const history = limit ? this.history.slice(-limit) : this.history;
    return [...history]; // Return copy to prevent mutation
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.history = [];
    this.historyCounter = 0;

    if (EventConfig.persistence.enabled && typeof window !== "undefined") {
      localStorage.removeItem(EventConfig.persistence.key);
    }

    if (EventConfig.debug.logEmits) {
      console.log("[EventBus] History cleared");
    }
  }

  /**
   * Get metrics (for monitoring)
   */
  public getMetrics() {
    return {
      ...this.metrics,
      activeListeners: this.countListeners(),
      wildcardListeners: this.wildcardListeners.size,
      historySize: this.history.length,
    };
  }

  /**
   * Count total active listeners
   */
  private countListeners(): number {
    let count = 0;
    this.listeners.forEach((listeners) => {
      count += listeners.size;
    });
    return count;
  }

  /**
   * Call a listener with error isolation and circuit breaker
   */
  private callListener<E extends EventName>(
    event: E,
    listener: EventListener<E>,
    data: EventData<E>
  ): void {
    // Check circuit breaker
    const breaker = this.circuitBreakers.get(listener);
    if (breaker && breaker.isOpen) {
      // Check if should reset
      if (
        Date.now() - breaker.lastFailure >
        EventConfig.circuitBreaker.resetTimeout
      ) {
        breaker.isOpen = false;
        breaker.failures = 0;
      } else {
        // Circuit is open, skip this listener
        return;
      }
    }

    try {
      // Call listener (can be async)
      const result = listener(data);

      // Handle async listeners
      if (result instanceof Promise) {
        result.catch((error) => {
          this.handleListenerError(event, listener, error);
        });
      }

      // Reset circuit breaker on success
      if (breaker) {
        breaker.failures = 0;
      }
    } catch (error) {
      this.handleListenerError(event, listener, error);
    }
  }

  /**
   * Call a wildcard listener with error isolation
   */
  private callWildcardListener(
    event: EventName,
    listener: WildcardListener,
    data: unknown
  ): void {
    try {
      const result = listener(event, data);

      // Handle async listeners
      if (result instanceof Promise) {
        result.catch((error) => {
          this.handleWildcardError(listener, error);
        });
      }
    } catch (error) {
      this.handleWildcardError(listener, error);
    }
  }

  /**
   * Handle listener errors with circuit breaker
   */
  private handleListenerError<E extends EventName>(
    event: E,
    listener: EventListener<E>,
    error: unknown
  ): void {
    this.metrics.totalErrors++;

    // Log error
    if (EventConfig.debug.logErrors) {
      console.error(`[EventBus] Listener error for ${event}:`, error);
    }

    // Update circuit breaker
    let breaker = this.circuitBreakers.get(listener);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
      };
      this.circuitBreakers.set(listener, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Open circuit if max failures reached
    if (breaker.failures >= EventConfig.circuitBreaker.maxFailures) {
      breaker.isOpen = true;
      console.warn(
        `[EventBus] Circuit breaker OPEN for ${event} after ${breaker.failures} failures`
      );

      // Remove the listener to prevent further errors
      this.off(event, listener);
    }

    // Emit error event (if not already in error handler to prevent infinite loop)
    if (event !== "system:listener_error") {
      this.emit("system:listener_error", {
        event,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Handle wildcard listener errors
   */
  private handleWildcardError(
    listener: WildcardListener,
    error: unknown
  ): void {
    this.metrics.totalErrors++;

    if (EventConfig.debug.logErrors) {
      console.error("[EventBus] Wildcard listener error:", error);
    }
  }

  /**
   * Add event to history (dev only)
   */
  private addToHistory(event: EventName, data: unknown): void {
    const timestamp = Date.now();
    const entry: EventHistoryEntry = {
      event,
      data,
      timestamp,
      id: `${event}_${timestamp}_${this.historyCounter++}`,
    };

    this.history.push(entry);

    // Limit history size
    if (this.history.length > EventConfig.persistence.limit) {
      this.history = this.history.slice(-EventConfig.persistence.limit);
    }

    // Save to localStorage
    this.saveHistoryToStorage();
  }

  /**
   * Load history from localStorage (dev only)
   */
  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem(EventConfig.persistence.key);
      if (stored) {
        this.history = JSON.parse(stored);
        if (EventConfig.debug.logEmits) {
          console.log(
            `[EventBus] Loaded ${this.history.length} events from storage`
          );
        }
      }
    } catch (error) {
      console.error("[EventBus] Failed to load history from storage:", error);
      this.history = [];
    }
  }

  /**
   * Save history to localStorage (dev only)
   */
  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem(
        EventConfig.persistence.key,
        JSON.stringify(this.history.slice(-EventConfig.persistence.limit))
      );
    } catch (error) {
      // Fail silently (localStorage might be full or disabled)
      if (EventConfig.debug.logErrors) {
        console.error("[EventBus] Failed to save history to storage:", error);
      }
    }
  }

  /**
   * Reset the singleton instance (for testing)
   * @internal
   */
  public static resetInstance(): void {
    EventBus.instance = null;
  }
}

/**
 * Convenience export for direct usage
 * @example
 * import { eventBus } from '@/lib/events';
 * eventBus.emit('note:created', { noteId, folderId, title, timestamp });
 */
export const eventBus = EventBus.getInstance();
