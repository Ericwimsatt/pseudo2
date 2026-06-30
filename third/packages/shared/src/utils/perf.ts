/**
 * Lightweight performance measurement. Used by the Performance panel
 * to display timings for loading, parsing, semantic generation, and
 * rendering. Each stage has a label and a duration in milliseconds.
 */

export interface PerfRecord {
  readonly id: string;
  readonly label: string;
  readonly stage: "load" | "parse" | "semantic" | "render" | "cache" | "other";
  readonly durationMs: number;
  readonly timestamp: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface PerfRecorder {
  start(label: string): () => void;
  record(label: string, durationMs: number, stage?: PerfRecord["stage"], meta?: PerfRecord["meta"]): void;
  records(): readonly PerfRecord[];
  clear(): void;
  subscribe(listener: (record: PerfRecord) => void): () => void;
}

let counter = 0;
const nextId = (): string => `perf-${Date.now().toString(36)}-${counter++}`;

export const createPerfRecorder = (): PerfRecorder => {
  const records: PerfRecord[] = [];
  const listeners = new Set<(record: PerfRecord) => void>();

  const add = (record: PerfRecord): void => {
    records.push(record);
    for (const listener of listeners) listener(record);
  };

  return {
    start: (label) => {
      const start = performance.now();
      return () => add({ id: nextId(), label, stage: "other", durationMs: performance.now() - start, timestamp: Date.now() });
    },
    record: (label, durationMs, stage = "other", meta) => {
      add({ id: nextId(), label, stage, durationMs, timestamp: Date.now(), meta });
    },
    records: () => records.slice(),
    clear: () => {
      records.length = 0;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
