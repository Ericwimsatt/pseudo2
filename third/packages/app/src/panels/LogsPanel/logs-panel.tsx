/**
 * The Logs panel displays structured application logs. It is the
 * primary debugging surface during development: nothing should be
 * hidden in the browser console.
 */

import { useAppStore } from "../../store/app-store.js";
import { useState, useMemo } from "react";
import type { LogEntry, LogLevel } from "@source-narrator/shared";

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "text-ink-muted",
  info: "text-status-info",
  warn: "text-status-warn",
  error: "text-status-error",
};

export const LogsPanel = () => {
  const logs = useAppStore((s) => s.logs);
  const [filter, setFilter] = useState("");
  const [minLevel, setMinLevel] = useState<LogLevel>("debug");

  const filtered = useMemo(() => {
    const order: LogLevel[] = ["debug", "info", "warn", "error"];
    const min = order.indexOf(minLevel);
    return logs.filter((l) => {
      if (order.indexOf(l.level) < min) return false;
      if (filter && !l.message.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, minLevel]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-2 py-1 text-xs border-b border-line-subtle">
        <select
          className="bg-bg-raised text-ink-primary border border-line-subtle rounded px-1 py-0.5"
          value={minLevel}
          onChange={(e) => setMinLevel(e.target.value as LogLevel)}
        >
          <option value="debug">Debug+</option>
          <option value="info">Info+</option>
          <option value="warn">Warn+</option>
          <option value="error">Error+</option>
        </select>
        <input
          className="flex-1 bg-bg-raised text-ink-primary border border-line-subtle rounded px-2 py-0.5"
          placeholder="Filter messages…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="text-ink-muted">{filtered.length}/{logs.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="p-3 text-ink-muted">No log entries match the current filter.</div>
        ) : (
          filtered.map((l: LogEntry) => (
            <div key={l.id} className="flex items-start gap-2 px-3 py-1 border-b border-line-subtle">
              <span className="text-ink-muted w-20 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
              <span className={`w-10 shrink-0 uppercase ${LEVEL_COLOR[l.level]}`}>{l.level}</span>
              <span className="w-20 shrink-0 text-ink-muted">{l.stage}</span>
              <span className="flex-1 text-ink-primary">{l.message}</span>
              {l.data ? <span className="text-ink-muted truncate max-w-[40%]">{JSON.stringify(l.data)}</span> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
