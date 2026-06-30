/**
 * Repository tree sidebar. Renders the file list of the loaded
 * repository, with collapsible folders, type icons, and selection
 * sync via the navigation controller.
 */

import { useMemo } from "react";
import { useAppStore } from "../../store/app-store.js";
import type { SourceFile } from "@source-narrator/translator-core/model";
import { normalizePath } from "@source-narrator/shared";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from "../icons.js";

export interface RepositoryTreeProps {
  readonly onSelect: (file: SourceFile) => void;
}

interface TreeNode {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly file?: SourceFile;
  readonly children: TreeNode[];
}

const buildTree = (files: readonly SourceFile[]): TreeNode => {
  const root: TreeNode = { name: "", path: "", isDirectory: true, children: [] };
  for (const file of files) {
    const parts = normalizePath(file.path).split("/");
    let current = root;
    for (let i = 0; i < parts.length; i += 1) {
      const segment = parts[i]!;
      const pathSoFar = parts.slice(0, i + 1).join("/");
      let next = current.children.find((c) => c.name === segment);
      if (!next) {
        const isLast = i === parts.length - 1;
        next = {
          name: segment,
          path: pathSoFar,
          isDirectory: !isLast,
          children: [],
          ...(isLast ? { file } : {}),
        };
        current.children.push(next);
      }
      current = next;
    }
  }
  const sortRecursive = (node: TreeNode): void => {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const c of node.children) sortRecursive(c);
  };
  sortRecursive(root);
  return root;
};

const TreeRow = (props: {
  node: TreeNode;
  depth: number;
  expanded: ReadonlySet<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  diagnosticCounts: Map<string, { warnings: number; unknowns: number }>;
  onSelect: (file: SourceFile) => void;
}) => {
  const { node, depth, expanded, onToggle, selectedPath, diagnosticCounts, onSelect } = props;
  const isExpanded = expanded.has(node.path);
  const isSelected = !node.isDirectory && node.file && selectedPath === node.file.path;
  const padding = 6 + depth * 12;
  const fileDiags = node.file ? diagnosticCounts.get(node.file.id) : null;

  if (node.isDirectory) {
    return (
      <div>
        <button
          className="w-full flex items-center gap-1.5 text-left hover:bg-bg-raised rounded-sm py-0.5"
          style={{ paddingLeft: padding }}
          onClick={() => onToggle(node.path)}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded ? <FolderOpen size={14} className="text-ink-secondary" /> : <Folder size={14} className="text-ink-secondary" />}
          <span className="text-sm text-ink-primary">{node.name}</span>
        </button>
        {isExpanded
          ? node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                selectedPath={selectedPath}
                diagnosticCounts={diagnosticCounts}
                onSelect={onSelect}
              />
            ))
          : null}
      </div>
    );
  }

  return (
    <button
      className={`w-full flex items-center gap-1.5 text-left rounded-sm py-0.5 ${
        isSelected ? "bg-accent-soft text-ink-primary" : "hover:bg-bg-raised"
      }`}
      style={{ paddingLeft: padding + 12 }}
      onClick={() => node.file && onSelect(node.file)}
    >
      <FileText size={14} className="text-ink-secondary" />
      <span className="text-sm font-mono flex-1 truncate text-left">{node.name}</span>
      {fileDiags && fileDiags.warnings > 0 ? (
        <span className="chip text-status-warn" title={`${fileDiags.warnings} parser warning(s)`}>
          {fileDiags.warnings}
        </span>
      ) : null}
      {fileDiags && fileDiags.unknowns > 0 ? (
        <span className="chip text-status-warn" title={`${fileDiags.unknowns} untranslated node(s)`}>
          ?
        </span>
      ) : null}
    </button>
  );
};

export const RepositoryTree = (props: RepositoryTreeProps) => {
  const repository = useAppStore((s) => s.repository);
  const selectedFile = useAppStore((s) => (s.selectedFileId ? s.repository?.fileById(s.selectedFileId) : null) ?? null);
  const expanded = useAppStore((s) => s.expandedFolders);
  const toggle = useAppStore((s) => s.toggleFolder);

  const tree = useMemo(() => (repository ? buildTree(repository.files()) : null), [repository]);

  if (!repository) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>No repository loaded.</p>
        <p className="mt-2 text-xs">Use the toolbar to open a local folder or load the sample repository.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="panel-header">
        <span>Repository</span>
        <span className="chip">{repository.metadata.fileCount} files</span>
      </header>
      <div className="panel-body p-1">
        {tree ? (
          tree.children.map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              selectedPath={selectedFile?.path ?? null}
              onSelect={props.onSelect}
            />
          ))
        ) : (
          <div className="p-3 text-xs text-ink-secondary">No files indexed.</div>
        )}
      </div>
    </div>
  );
};
