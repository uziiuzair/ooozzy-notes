"use client";

import { useState, useEffect } from "react";
import { aiDebugger, AILog } from "@/lib/ai/aiDebugger";
import { cn } from "@/lib/utils";

export function AIDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    const unsubscribe = aiDebugger.subscribe(setLogs);
    setLogs(aiDebugger.getLogs());
    return unsubscribe;
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        aria-label="Open AI Debugger"
      >
        🤖 AI Logs ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              🤖 AI Debugger
            </h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {logs.length} logs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => aiDebugger.clear()}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Logs List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No AI logs yet</p>
                <p className="text-xs mt-2">
                  AI interactions will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-gray-50 transition-colors",
                      selectedLog?.id === log.id && "bg-blue-50 border-l-4 border-blue-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            log.type === "classification" && "bg-purple-100 text-purple-700",
                            log.type === "chat" && "bg-green-100 text-green-700",
                            log.type === "embedding" && "bg-yellow-100 text-yellow-700",
                            log.type === "other" && "bg-gray-100 text-gray-700"
                          )}>
                            {log.type}
                          </span>
                          {log.error && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                              Error
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                          {log.operation}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {log.duration && (
                        <span className="text-xs text-gray-400">
                          {log.duration}ms
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedLog ? (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded",
                      selectedLog.type === "classification" && "bg-purple-100 text-purple-700",
                      selectedLog.type === "chat" && "bg-green-100 text-green-700",
                      selectedLog.type === "embedding" && "bg-yellow-100 text-yellow-700",
                      selectedLog.type === "other" && "bg-gray-100 text-gray-700"
                    )}>
                      {selectedLog.type}
                    </span>
                    {selectedLog.duration && (
                      <span className="text-sm text-gray-500">
                        {selectedLog.duration}ms
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedLog.operation}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Metadata
                    </h4>
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Prompt
                  </h4>
                  <pre className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto border border-gray-200">
                    {selectedLog.prompt}
                  </pre>
                </div>

                {/* Response or Error */}
                {selectedLog.error ? (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2">
                      Error
                    </h4>
                    <pre className="bg-red-50 rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto border border-red-200 text-red-900">
                      {selectedLog.error}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Response
                    </h4>
                    <pre className="bg-green-50 rounded-lg p-4 text-sm whitespace-pre-wrap overflow-x-auto border border-green-200">
                      {selectedLog.response}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">Select a log to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
