/**
 * EventDebugger Component
 *
 * Visual debugging panel for the event system
 * Shows real-time event stream in development mode
 *
 * Features:
 * - Real-time event display with smooth animations
 * - Filter by event name/namespace
 * - Copy event data to clipboard
 * - Clear history
 * - Animated minimize/maximize
 * - Event count badge with spring animation
 * - Staggered event list animations
 * - Interactive hover/tap animations
 *
 * Only renders in development mode
 *
 * @module components/organisms/EventDebugger
 */

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EventConfig } from "@/lib/events/config";
import { useEventHistory } from "@/lib/events/hooks/useEventHistory";
import { cn } from "@/lib/utils";

/**
 * Visual Event Debugger Component
 *
 * Renders a floating panel showing real-time event stream
 * Only visible in development mode
 *
 * @example
 * // In app/layout.tsx
 * import { EventDebugger } from '@/components/organisms/EventDebugger';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AppProvider>
 *           {children}
 *           {process.env.NODE_ENV === 'development' && <EventDebugger />}
 *         </AppProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function EventDebugger() {
  const [isMinimized, setIsMinimized] = useState<boolean>(
    EventConfig.debugger.defaultMinimized
  );
  const [filter, setFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { events, clear, totalCount } = useEventHistory({
    limit: EventConfig.debugger.maxDisplayedEvents,
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!filter) return events;

    const lowerFilter = filter.toLowerCase();
    return events.filter((event) =>
      event.event.toLowerCase().includes(lowerFilter)
    );
  }, [events, filter]);

  // Only render in development
  if (!EventConfig.debugger.enabled) {
    return null;
  }

  // Copy event data to clipboard
  const handleCopy = async (event: (typeof events)[0]) => {
    try {
      const text = JSON.stringify(
        {
          event: event.event,
          data: event.data,
          timestamp: new Date(event.timestamp).toISOString(),
        },
        null,
        2
      );
      await navigator.clipboard.writeText(text);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // Format event data for display
  const formatData = (data: unknown): string => {
    if (data === undefined || data === null) return "void";
    if (typeof data === "object") {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  return (
    <div className="fixed w-fit bottom-3 right-6 z-[9999] font-mono text-sm shadow-none select-none">
      {/* Header */}
      <motion.div
        className={cn(
          "py-3 px-6 flex items-center justify-center border gap-3 shadow-none w-full cursor-pointer",
          "border border-stone-400 bg-stone-200 text-stone-600 hover:bg-stone-200 hover:text-stone-800",
          "transition-all duration-300",
          isMinimized ? "rounded-full" : "rounded-t-xl"
        )}
        onClick={() => setIsMinimized(!isMinimized)}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isMinimized ? "justify-center w-full" : "justify-between w-full"
          )}
        >
          <div className="flex items-center gap-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>

            {!isMinimized && (
              <span className="ml-2 font-semibold">Event Debugger</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {totalCount > 0 && (
              <motion.span
                key={totalCount}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={cn(
                  "text-stone-600 flex items-center justify-center aspect-square rounded-full text-sm shadow-none",
                  isMinimized ? "bg-transparent w-fit" : "bg-stone-300 w-6"
                )}
              >
                {totalCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-stone-200 border border-t-0 border-stone-400 rounded-b-xl shadow-none w-[600px] select-text overflow-hidden"
          >
            {/* Filter */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="py-3 px-6 border-b flex items-center gap-3 border-stone-400/20 shadow-none"
            >
              <input
                type="text"
                placeholder="Filter events..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-400/20 rounded-lg shadow-none focus:outline-none focus:border-[#363C45] text-[#363C45]"
              />
              <motion.button
                onClick={clear}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 py-1 text-xs text-stone-600 rounded-full bg-stone-300/10 hover:bg-stone-300/20 transition-colors shadow-none cursor-pointer"
                title="Clear history"
              >
                Clear
              </motion.button>
            </motion.div>

            {/* Event List */}
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {filteredEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 text-center text-[#363C45]/60"
                  >
                    {filter ? "No matching events" : "No events yet"}
                  </motion.div>
                ) : (
                  filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id + String(index)}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(index * 0.03, 0.3),
                      }}
                      className="px-6 py-3 border-b border-[#363C45]/10 hover:bg-[#363C45]/5 transition-colors shadow-none last:border-b-0"
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <span className="text-[#363C45]/60 text-xs">
                            {formatTime(event.timestamp)}
                          </span>
                          <div className="font-semibold text-[#363C45] break-all">
                            {event.event}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleCopy(event)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="px-2 py-1 text-xs rounded-full bg-[#363C45]/10 hover:bg-[#363C45]/20 transition-colors text-[#363C45] shadow-none shrink-0"
                          title="Copy to clipboard"
                        >
                          {copiedId === event.id ? "✓" : "Copy"}
                        </motion.button>
                      </div>

                      {/* Event Data */}
                      <pre className="text-xs bg-[#363C45]/5 p-2 rounded overflow-x-auto text-[#363C45] shadow-none">
                        {formatData(event.data)}
                      </pre>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="p-2 bg-[#363C45]/5 text-xs text-[#363C45]/60 text-center border-t border-[#363C45]/10 shadow-none rounded-b-xl"
            >
              {filteredEvents.length !== totalCount
                ? `Showing ${filteredEvents.length} of ${totalCount} events`
                : `${totalCount} ${totalCount === 1 ? "event" : "events"}`}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
