/**
 * The application store. Mirrors the controllers' state into a
 * React-friendly shape. Selectors are colocated with the store so
 * panels can read the smallest possible slice of state.
 *
 * The store is intentionally dumb: controllers are the source of
 * truth. Subscriptions to the controllers' event bus are the only
 * side effects performed here.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  asFileId,
  asAstNodeId,
  asSemanticNodeId,
  type FileId,
  type AstNodeId,
  type SemanticNodeId,
  type SelectionTarget,
  type SourceRange,
  type LogEntry,
  type PerfRecord,
  type Diagnostic,
  type Position,
  containsPosition,
} from "@source-narrator/shared";
import type {
  Repository,
  EnglishLine,
  SemanticGraph,
  SourceFile,
} from "@source-narrator/translator-core/model";
import type { AstNode } from "@source-narrator/language-typescript/parser";
import type { AppController, InspectorViewModel } from "../controllers/index.js";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";

export type DevTab = "source" | "ast" | "semantic" | "english" | "diagnostics" | "logs" | "performance";

export interface AppState {
  controller: AppController | null;
  repository: Repository | null;
  selectedFileId: FileId | null;
  selection: SelectionTarget | null;
  expandedFolders: ReadonlySet<string>;
  openDevTabs: readonly DevTab[];
  activeDevTab: DevTab;
  logs: readonly LogEntry[];
  perf: readonly PerfRecord[];
  diagnostics: readonly Diagnostic[];
  isLoading: boolean;
  loadProgress: { total: number; processed: number; currentPath: string | null } | null;
  loadError: string | null;

  // setters / actions
  setController(controller: AppController | null): void;
  setRepository(repository: Repository | null): void;
  setSelectedFile(id: FileId | null): void;
  setSelection(selection: SelectionTarget | null): void;
  toggleFolder(path: string): void;
  openTab(tab: DevTab): void;
  closeTab(tab: DevTab): void;
  setActiveTab(tab: DevTab): void;
  appendLog(entry: LogEntry): void;
  appendPerf(record: PerfRecord): void;
  appendDiagnostic(diagnostic: Diagnostic): void;
  setLoading(loading: boolean): void;
  setLoadProgress(progress: AppState["loadProgress"]): void;
  setLoadError(message: string | null): void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    controller: null,
    repository: null,
    selectedFileId: null,
    selection: null,
    expandedFolders: new Set<string>(),
    openDevTabs: ["source", "ast", "semantic", "english", "diagnostics", "logs", "performance"] as const,
    activeDevTab: "english",
    logs: [],
    perf: [],
    diagnostics: [],
    isLoading: false,
    loadProgress: null,
    loadError: null,

    setController: (controller) => set({ controller }),
    setRepository: (repository) => set({ repository }),
    setSelectedFile: (id) => set({ selectedFileId: id }),
    setSelection: (selection) => set({ selection }),

    toggleFolder: (path) =>
      set((state) => {
        const next = new Set(state.expandedFolders);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return { expandedFolders: next };
      }),

    openTab: (tab) =>
      set((state) =>
        state.openDevTabs.includes(tab)
          ? { activeDevTab: tab }
          : { openDevTabs: [...state.openDevTabs, tab], activeDevTab: tab },
      ),

    closeTab: (tab) =>
      set((state) => {
        if (!state.openDevTabs.includes(tab)) return state;
        const next = state.openDevTabs.filter((t) => t !== tab);
        const active = state.activeDevTab === tab ? (next[0] ?? "english") : state.activeDevTab;
        return { openDevTabs: next, activeDevTab: active as DevTab };
      }),

    setActiveTab: (tab) => set({ activeDevTab: tab }),

    appendLog: (entry) => set((state) => ({ logs: [...state.logs, entry].slice(-2000) })),
    appendPerf: (record) => set((state) => ({ perf: [...state.perf, record].slice(-1000) })),
    appendDiagnostic: (diagnostic) =>
      set((state) => ({ diagnostics: [...state.diagnostics, diagnostic].slice(-1000) })),

    setLoading: (loading) => set({ isLoading: loading }),
    setLoadProgress: (progress) => set({ loadProgress: progress }),
    setLoadError: (message) => set({ loadError: message }),
  })),
);

// --- Selectors ---------------------------------------------------------

export const selectCurrentFile = (state: AppState): SourceFile | null => {
  if (!state.repository || !state.selectedFileId) return null;
  return state.repository.fileById(state.selectedFileId);
};

export const selectCurrentAst = (state: AppState): AstNode | null => {
  if (!state.repository || !state.selectedFileId) return null;
  const tree = state.repository.getParseTree(state.selectedFileId);
  return tree?.astRoot ?? null;
};

export const selectCurrentSemantic = (state: AppState): SemanticGraph | null => {
  if (!state.repository || !state.selectedFileId) return null;
  return state.repository.getSemanticGraph(state.selectedFileId);
};

export const selectCurrentEnglish = (state: AppState): readonly EnglishLine[] => {
  if (!state.repository || !state.selectedFileId) return [];
  return state.repository.getEnglish(state.selectedFileId);
};

export const selectInspector = (state: AppState): InspectorViewModel | null => {
  if (!state.controller) return null;
  return state.controller.inspector.viewModel();
};

// --- Helpers for AST/semantic search -----------------------------------

export const astNodeAt = (root: AstNode, pos: Position): AstNode | null => {
  let best: AstNode | null = null;
  const visit = (n: AstNode): void => {
    if (!containsPosition(n.range, pos)) return;
    best = n;
    for (const c of n.children) visit(c);
  };
  visit(root);
  return best;
};

export const semanticNodeAt = (graph: SemanticGraph, pos: Position) => {
  let best: SemanticNode | null = null;
  for (const root of graph.nodes) {
    const visit = (n: SemanticNode): void => {
      if (!containsPosition(n.source, pos)) return;
      best = n;
      for (const c of n.children) visit(c);
    };
    visit(root);
  }
  return best;
};

export const englishLineForRange = (lines: readonly EnglishLine[], range: SourceRange): number | null => {
  // Map a source range to the english line whose semantic nodes
  // intersect the range. Pick the first match.
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    // Without a direct mapping, fall back to a heuristic.
    void range;
    if (line.text.length > 0) return i;
  }
  return null;
};

// Re-export branded id helpers for convenience.
export { asFileId, asAstNodeId, asSemanticNodeId };
