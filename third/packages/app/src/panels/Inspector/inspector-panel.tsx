/**
 * The Inspector panel renders the details of the current selection.
 * It is intentionally read-only: it queries the controllers' view
 * model and renders the result. All navigation occurs through the
 * navigation controller, ensuring every other panel stays in sync.
 */

import { useAppStore, selectInspector } from "../../store/app-store.js";
import type { InspectorViewModel } from "../../controllers/index.js";

const FieldRow = ({ k, v }: { k: string; v: string }) => (
  <div className="grid grid-cols-[100px_1fr] gap-2 py-0.5">
    <div className="text-ink-muted text-[11px] uppercase tracking-wide">{k}</div>
    <div className="text-ink-primary text-xs font-mono break-words whitespace-pre-wrap">{v}</div>
  </div>
);

const ChildItem = ({ vm, depth }: { vm: InspectorViewModel; depth: number }) => (
  <div className="py-0.5 text-xs" style={{ paddingLeft: 6 + depth * 12 }}>
    <span className="chip mr-1">{vm.kind}</span>
    <span className="text-ink-primary">{vm.title}</span>
  </div>
);

export const InspectorPanel = () => {
  const vm = useAppStore(selectInspector);
  if (!vm) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p className="text-ink-muted text-xs">No selection</p>
        <p className="mt-2">
          Click a file in the repository tree to start inspecting its entities. Selecting an English line, AST
          node, or semantic node will populate this panel.
        </p>
      </div>
    );
  }
  return (
    <div className="h-full overflow-auto text-xs">
      <div className="px-3 py-2 border-b border-line-subtle bg-bg-sunken">
        <div className="flex items-center gap-2">
          <span className="chip">{vm.kind}</span>
          <span className="text-ink-muted text-[10px]">{vm.language}</span>
        </div>
        <div className="mt-1 text-ink-primary font-semibold text-sm">{vm.title}</div>
        {vm.subtitle ? <div className="text-ink-secondary text-xs mt-0.5 font-mono">{vm.subtitle}</div> : null}
      </div>
      {vm.fields.length > 0 ? (
        <div className="px-3 py-2 border-b border-line-subtle">
          {vm.fields.map((f) => (
            <FieldRow key={f.key} k={f.key} v={f.value} />
          ))}
        </div>
      ) : null}
      {vm.sourceRange ? (
        <div className="px-3 py-2 border-b border-line-subtle">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">Source range</div>
          <div className="text-ink-primary text-xs font-mono">
            {vm.sourceRange.start.line}:{vm.sourceRange.start.column} – {vm.sourceRange.end.line}:{vm.sourceRange.end.column}
          </div>
        </div>
      ) : null}
      {vm.children.length > 0 ? (
        <div className="px-3 py-2 border-b border-line-subtle">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">
            Children ({vm.children.length})
          </div>
          {vm.children.map((c, i) => (
            <ChildItem key={i} vm={c} depth={0} />
          ))}
        </div>
      ) : null}
      {vm.parent ? (
        <div className="px-3 py-2 border-b border-line-subtle">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">Parent</div>
          <ChildItem vm={vm.parent} depth={0} />
        </div>
      ) : null}
      {vm.relationships.length > 0 ? (
        <div className="px-3 py-2 border-b border-line-subtle">
          <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">Relationships</div>
          {vm.relationships.map((r, i) => (
            <div key={i} className="text-xs font-mono py-0.5">
              <span className="chip mr-1">{r.direction === "out" ? "→" : "←"}</span>
              <span className="text-accent-primary mr-1">{r.kind}</span>
              <span className="text-ink-primary">{r.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
