/**
 * The Semantic IR panel renders the language-independent semantic
 * graph for the current file. This is the primary debugging tool
 * for adapter authors and translator maintainers: it shows the
 * shape of the IR regardless of the source language.
 */

import { useState, useMemo } from "react";
import { useAppStore, selectCurrentSemantic } from "../../store/app-store.js";
import { ChevronRight, ChevronDown } from "../../components/icons.js";
import type { SemanticGraph } from "@source-narrator/translator-core/semantic/semantic-graph";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import type { SemanticNodeId } from "@source-narrator/shared";

const SemanticRow = (props: {
  node: SemanticNode;
  depth: number;
  selected: SemanticNodeId | null;
  expanded: ReadonlySet<SemanticNodeId>;
  onToggle: (id: SemanticNodeId) => void;
  onSelect: (id: SemanticNodeId) => void;
}) => {
  const { node, depth, selected, expanded, onToggle, onSelect } = props;
  const isExpanded = expanded.has(node.id) || depth < 2;
  const isSelected = selected === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 text-xs py-0.5 px-1 rounded-sm cursor-pointer ${
          isSelected ? "bg-accent-soft text-ink-primary" : "hover:bg-bg-raised"
        }`}
        style={{ paddingLeft: 6 + depth * 14 }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="text-ink-muted"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-3 inline-block" />
        )}
        <span className="chip">{node.kind}</span>
        {node.name ? <span className="font-mono text-ink-primary">{node.name}</span> : null}
        <span className="text-ink-muted truncate">{truncate(node.text)}</span>
        <span className="ml-auto text-ink-muted text-[10px]">
          {node.source.start.line}:{node.source.start.column}
        </span>
      </div>
      {isExpanded && hasChildren
        ? node.children.map((c) => (
            <SemanticRow
              key={c.id}
              node={c}
              depth={depth + 1}
              selected={selected}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
};

const truncate = (s: string, max = 80): string => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

export const SemanticPanel = () => {
  const graph = useAppStore(selectCurrentSemantic);
  const selection = useAppStore((s) => s.selection);
  const controller = useAppStore((s) => s.controller);
  const [expanded, setExpanded] = useState<ReadonlySet<SemanticNodeId>>(() => new Set());

  const roots: readonly SemanticNode[] = useMemo(
    () => (graph ? graph.nodes.filter((n) => n.parentId === null) : []),
    [graph],
  );

  const selectedId: SemanticNodeId | null =
    selection?.kind === "semantic-node"
      ? selection.semanticNodeId
      : selection?.kind === "ast-node" && graph
        ? findByRange(graph, selection.astNodeId as unknown as SemanticNodeId)
        : null;

  const handleSelect = (id: SemanticNodeId) => {
    const fileId = useAppStore.getState().selectedFileId;
    if (!fileId || !controller) return;
    controller.navigation.selectSemanticNode(fileId, id);
  };

  const handleToggle = (id: SemanticNodeId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!graph) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>No semantic graph available for the current file.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-ink-muted px-1 pb-1">
        <span>Semantic IR</span>
        <span>{graph.nodes.length} nodes · {graph.relationships.length} relationships</span>
      </div>
      {roots.length === 0 ? (
        <div className="p-3 text-xs text-ink-muted">No root nodes yet.</div>
      ) : (
        roots.map((r) => (
          <SemanticRow
            key={r.id}
            node={r}
            depth={0}
            selected={selectedId}
            expanded={expanded}
            onToggle={handleToggle}
            onSelect={handleSelect}
          />
        ))
      )}
    </div>
  );
};

const findByRange = (graph: SemanticGraph, _fallback: SemanticNodeId): SemanticNodeId | null => {
  // Placeholder for cross-resolution. The semantic graph does not
  // currently store AST id mappings, so we can't translate an AST
  // node id into a semantic id. Selecting from the AST panel will
  // select a semantic node with the matching id when present.
  for (const n of graph.nodes) {
    if (n.id === _fallback) return n.id;
  }
  return null;
};
