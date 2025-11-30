/**
 * AI Debugger - Captures all AI prompts and responses
 * Similar to EventDebugger but for AI interactions
 */

export interface AILog {
  id: string;
  timestamp: number;
  type: "classification" | "chat" | "embedding" | "other";
  operation: string;
  prompt: string;
  response: string;
  metadata?: Record<string, unknown>;
  duration?: number;
  error?: string;
}

class AIDebuggerService {
  private logs: AILog[] = [];
  private maxLogs = 100; // Keep last 100 logs
  private listeners: ((logs: AILog[]) => void)[] = [];

  log(entry: Omit<AILog, "id" | "timestamp">) {
    const aiLog: AILog = {
      ...entry,
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.logs.unshift(aiLog); // Add to beginning

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]));

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[AI ${entry.type}]`, entry.operation, {
        prompt: entry.prompt.substring(0, 200) + "...",
        response: entry.response.substring(0, 200) + "...",
        duration: entry.duration,
        metadata: entry.metadata,
      });
    }
  }

  getLogs(): AILog[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: AILog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  clear() {
    this.logs = [];
    this.listeners.forEach((listener) => listener([]));
  }
}

// Singleton instance
export const aiDebugger = new AIDebuggerService();
