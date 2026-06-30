/**
 * The AST panel renders a collapsible tree of the TypeScript AST
 * for the current file. Selecting a node synchronises the
 * selection in the navigation controller so the Source, Semantic
 * and English panels all jump to the corresponding entity.
 */

import { useState } from "react";
import { useAppStore, selectCurrentAst } from "../../store/app-store.js";
import { ChevronRight, ChevronDown } from "../../components/icons.js";
import type { AstNode } from "@source-narrator/language-typescript/parser";
import type { AstNodeId } from "@source-narrator/shared";

const findById = (root: AstNode, id: AstNodeId): AstNode | null => {
  if (root.id === id) return root;
  for (const c of root.children) {
    const f = findById(c, id);
    if (f) return f;
  }
  return null;
};

const AstTreeRow = (props: {
  node: AstNode;
  depth: number;
  selected: AstNodeId | null;
  expandedIds: ReadonlySet<AstNodeId>;
  onToggle: (id: AstNodeId) => void;
  onSelect: (id: AstNodeId) => void;
}) => {
  const { node, depth, selected, expandedIds, onToggle, onSelect } = props;
  const isExpanded = expandedIds.has(node.id) || depth < 2;
  const isSelected = selected === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 text-xs font-mono py-0.5 px-1 rounded-sm cursor-pointer ${
          isSelected ? "bg-accent-soft text-ink-primary" : "hover:bg-bg-raised"
        }`}
        style={{ paddingLeft: 6 + depth * 12 }}
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
        <span className="text-accent-primary">{node.kindName}</span>
        <span className="text-ink-muted">@ {node.range.start.line}:{node.range.start.column}</span>
        {node.text && node.text.length < 80 ? (
          <span className="text-ink-secondary truncate"> = {node.text}</span>
        ) : null}
      </div>
      {isExpanded && hasChildren
        ? node.children.map((c) => (
            <AstTreeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              selected={selected}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
};

export const AstPanel = () => {
  const ast = useAppStore(selectCurrentAst);
  const selectedFile = useAppStore((s) => (s.selectedFileId ? s.repository?.fileById(s.selectedFileId) : null) ?? null);
  const selection = useAppStore((s) => s.selection);
  const controller = useAppStore((s) => s.controller);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<AstNodeId>>(() => new Set());

  const selectedAstId: AstNodeId | null =
    selection?.kind === "ast-node"
      ? selection.astNodeId
      : selection?.kind === "semantic-node" && ast
        ? (findById(ast, selection.semanticNodeId as unknown as AstNodeId)?.id ?? null)
        : null;

  const handleSelect = (id: AstNodeId) => {
    const fileId = useAppStore.getState().selectedFileId;
    if (!fileId || !controller) return;
    controller.navigation.selectAstNode(fileId, id);
  };

  const handleToggle = (id: AstNodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!selectedFile) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>Select a file to view its AST.</p>
      </div>
    );
  }
  if (!ast) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>No AST available. Parsing may still be in progress.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted px-1 pb-1">TypeScript AST</div>
      <AstTreeRow
        node={ast}
        depth={0}
        selected={selectedAstId}
        expandedIds={expandedIds}
        onToggle={handleToggle}
        onSelect={handleSelect}
      />
    </div>
  );
};
