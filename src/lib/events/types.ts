/**
 * Global Event Registry - Type-Safe Event System
 *
 * Event Naming Convention: namespace:action
 * Examples: note:created, folder:updated, photo:uploaded
 *
 * @module events/types
 */

/**
 * Global event registry with type-safe event names and data payloads
 *
 * Add new events here to get autocomplete and type safety throughout the app
 */
export type AppEvents = {
  // ============================================================
  // Note Events - Note management
  // ============================================================
  "note:created": {
    noteId: string;
    folderId: string | null;
    title: string;
    timestamp: number;
  };

  "note:updated": {
    noteId: string;
    folderId: string | null;
    fieldsUpdated: string[];
    timestamp: number;
  };

  "note:deleted": {
    noteId: string;
    folderId: string | null;
    timestamp: number;
  };

  "note:moved": {
    noteId: string;
    fromFolderId: string | null;
    toFolderId: string | null;
    timestamp: number;
  };

  // ============================================================
  // Folder Events - Folder management
  // ============================================================
  "folder:created": {
    folderId: string;
    name: string;
    timestamp: number;
  };

  "folder:updated": {
    folderId: string;
    fieldsUpdated: string[];
    timestamp: number;
  };

  "folder:deleted": {
    folderId: string;
    noteCount: number;
    timestamp: number;
  };

  "folder:opened": {
    folderId: string;
    timestamp: number;
  };

  "folder:closed": {
    folderId: string;
    timestamp: number;
  };

  // ============================================================
  // Photo Events - Photo management
  // ============================================================
  "photo:uploaded": {
    photoId: string;
    folderId: string | null;
    size: number;
    timestamp: number;
  };

  "photo:deleted": {
    photoId: string;
    folderId: string | null;
    timestamp: number;
  };

  "photo:moved": {
    photoId: string;
    fromFolderId: string | null;
    toFolderId: string | null;
    timestamp: number;
  };

  "photo:updated": {
    photoId: string;
    folderId: string | null;
    fieldsUpdated: string[];
    timestamp: number;
  };

  // ============================================================
  // Link Events - Link management
  // ============================================================
  "link:captured": {
    linkId: string;
    url: string;
    domain: string;
    timestamp: number;
  };

  "link:deleted": {
    linkId: string;
    timestamp: number;
  };

  "link:moved": {
    linkId: string;
    fromFolderId: string | null;
    toFolderId: string | null;
    timestamp: number;
  };

  "link:updated": {
    linkId: string;
    folderId: string | null;
    fieldsUpdated: string[];
    timestamp: number;
  };

  // ============================================================
  // Label Events - Label management
  // ============================================================
  "label:created": {
    labelId: string;
    name: string;
    timestamp: number;
  };

  "label:updated": {
    labelId: string;
    fieldsUpdated: string[];
    timestamp: number;
  };

  "label:deleted": {
    labelId: string;
    timestamp: number;
  };

  // ============================================================
  // Search Events - Search interactions
  // ============================================================
  "search:performed": {
    query: string;
    resultsCount: number;
    timestamp: number;
  };

  "search:cleared": {
    timestamp: number;
  };

  // ============================================================
  // Error Events - System errors and failures
  // ============================================================
  "error:storage_quota": {
    operation: string;
    error: Error;
    timestamp: number;
  };

  "error:network": {
    type: "offline" | "timeout" | "failed";
    url?: string;
    error?: Error;
    timestamp: number;
  };

  "error:client": {
    component: string;
    error: Error;
    stack?: string;
    timestamp: number;
  };

  "system:listener_error": {
    event: string;
    error: Error;
    listenerName?: string;
  };

  // ============================================================
  // System Events - Application lifecycle and system state
  // ============================================================
  "system:initialized": {
    timestamp: number;
    environment: "development" | "production";
  };

  "system:offline": void;

  "system:online": void;

  "system:visibility_changed": {
    visible: boolean;
    timestamp: number;
  };

  // ============================================================
  // User Action Events - Generic user interactions
  // ============================================================
  "user:action": {
    action: string;
    metadata?: Record<string, unknown>;
    timestamp: number;
  };

  "user:navigation": {
    from: string;
    to: string;
    timestamp: number;
  };
};

/**
 * Union type of all event names
 * Use this for autocomplete: EventName type
 */
export type EventName = keyof AppEvents;

/**
 * Get the data type for a specific event
 * Usage: EventData<'note:created'> => { noteId: string; folderId: string | null; ... }
 */
export type EventData<E extends EventName> = AppEvents[E];

/**
 * Type for event listener functions
 * Listeners can be sync or async
 */
export type EventListener<E extends EventName> = (
  data: EventData<E>
) => void | Promise<void>;

/**
 * Wildcard listener that receives all events
 * Used for debugging and monitoring
 */
export type WildcardListener = (
  event: EventName,
  data: unknown
) => void | Promise<void>;

/**
 * Event history entry for debugging
 */
export interface EventHistoryEntry {
  event: EventName;
  data: unknown;
  timestamp: number;
  id: string; // Unique identifier for each event
}

/**
 * Circuit breaker state for a listener
 */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}
