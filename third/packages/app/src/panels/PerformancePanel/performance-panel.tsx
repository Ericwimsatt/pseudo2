/**
 * The Performance panel shows timings for repository loading,
 * parsing, semantic generation, rendering, and cache lookups.
 *
 * Records are collected via the perf recorder wired into the
 * AppController, so the panel reflects actual instrumented work.
 */

import { useAppStore } from "../../store/app-store.js";
import { Clock } from "../../components/icons.js";
import { useMemo } from "react";
import type { PerfRecord } from "@source-narrator/shared";

const groupByStage = (records: readonly PerfRecord[]): Map<PerfRecord["stage"], PerfRecord[]> => {
  const map = new Map<PerfRecord["stage"], PerfRecord[]>();
  for (const r of records) {
    const arr = map.get(r.stage) ?? [];
    arr.push(r);
    map.set(r.stage, arr);
  }
  return map;
};

const aggregate = (records: readonly PerfRecord[]): { count: number; total: number; max: number; avg: number } => {
  if (records.length === 0) return { count: 0, total: 0, max: 0, avg: 0 };
  let total = 0;
  let max = 0;
  for (const r of records) {
    total += r.durationMs;
    if (r.durationMs > max) max = r.durationMs;
  }
  return { count: records.length, total, max, avg: total / records.length };
};

export const PerformancePanel = () => {
  const records = useAppStore((s) => s.perf);
  const grouped = useMemo(() => groupByStage(records), [records]);
  const stages: readonly PerfRecord["stage"][] = ["load", "parse", "semantic", "render", "cache", "other"];

  return (
    <div className="h-full overflow-auto text-xs font-mono">
      <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-ink-muted border-b border-line-subtle">
        Performance
      </div>
      <table className="w-full">
        <thead className="text-ink-muted text-[10px] uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-1">Stage</th>
            <th className="text-right px-3 py-1">Count</th>
            <th className="text-right px-3 py-1">Total</th>
            <th className="text-right px-3 py-1">Avg</th>
            <th className="text-right px-3 py-1">Max</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => {
            const records = grouped.get(stage) ?? [];
            const agg = aggregate(records);
            return (
              <tr key={stage} className="border-b border-line-subtle">
                <td className="px-3 py-1 flex items-center gap-1 text-ink-primary">
                  <Clock size={10} className="text-ink-muted" />
                  <span>{stage}</span>
                </td>
                <td className="text-right px-3 py-1 text-ink-secondary">{agg.count}</td>
                <td className="text-right px-3 py-1 text-ink-secondary">{fmt(agg.total)}</td>
                <td className="text-right px-3 py-1 text-ink-secondary">{fmt(agg.avg)}</td>
                <td className="text-right px-3 py-1 text-ink-secondary">{fmt(agg.max)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-ink-muted border-y border-line-subtle">
        Recent records
      </div>
      <div>
        {records.slice(-100).reverse().map((r) => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-0.5 border-b border-line-subtle">
            <span className="text-ink-muted w-20 shrink-0">{new Date(r.timestamp).toLocaleTimeString()}</span>
            <span className="text-accent-primary w-20 shrink-0">{r.stage}</span>
            <span className="flex-1 text-ink-primary truncate">{r.label}</span>
            <span className="text-ink-secondary">{fmt(r.durationMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const fmt = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};
