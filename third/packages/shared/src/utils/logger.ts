/**
 * Tiny structured logger. The application shell and controllers should
 * route all messages through this so they can appear in the Logs panel
 * and the browser console in a consistent format.
 */

import type { DiagnosticStage, DiagnosticSeverity } from "../types/diagnostics.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly stage: DiagnosticStage | "app";
  readonly message: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export type LogSubscriber = (entry: LogEntry) => void;

export interface Logger {
  debug(stage: LogEntry["stage"], message: string, data?: LogEntry["data"]): void;
  info(stage: LogEntry["stage"], message: string, data?: LogEntry["data"]): void;
  warn(stage: LogEntry["stage"], message: string, data?: LogEntry["data"]): void;
  error(stage: LogEntry["stage"], message: string, data?: LogEntry["data"]): void;
  subscribe(subscriber: LogSubscriber): () => void;
  entries(): readonly LogEntry[];
  clear(): void;
}

let counter = 0;
const nextId = (): string => {
  counter += 1;
  return `log-${Date.now().toString(36)}-${counter}`;
};

const levelToSeverity = (level: LogLevel): DiagnosticSeverity => {
  switch (level) {
    case "debug":
      return "info";
    case "info":
      return "info";
    case "warn":
      return "warning";
    case "error":
      return "error";
  }
};

export const createLogger = (): Logger => {
  const subscribers = new Set<LogSubscriber>();
  const stored: LogEntry[] = [];
  const maxEntries = 2000;

  const emit = (entry: LogEntry): void => {
    stored.push(entry);
    if (stored.length > maxEntries) stored.splice(0, stored.length - maxEntries);
    for (const sub of subscribers) {
      try {
        sub(entry);
      } catch (cause) {
        // eslint-disable-next-line no-console
        console.error("[logger] subscriber threw", cause);
      }
    }
    const consoleMethod =
      entry.level === "error"
        ? console.error
        : entry.level === "warn"
          ? console.warn
          : entry.level === "info"
            ? console.info
            : console.debug;
    consoleMethod(`[${entry.stage}] ${entry.message}`, entry.data ?? "");
  };

  const log = (
    level: LogLevel,
    stage: LogEntry["stage"],
    message: string,
    data?: LogEntry["data"],
  ): void => {
    emit({ id: nextId(), timestamp: Date.now(), level, stage, message, data });
  };

  return {
    debug: (s, m, d) => log("debug", s, m, d),
    info: (s, m, d) => log("info", s, m, d),
    warn: (s, m, d) => log("warn", s, m, d),
    error: (s, m, d) => log("error", s, m, d),
    subscribe: (sub) => {
      subscribers.add(sub);
      return () => subscribers.delete(sub);
    },
    entries: () => stored.slice(),
    clear: () => {
      stored.length = 0;
    },
  };
};

export const loggerLevelToSeverity = levelToSeverity;
