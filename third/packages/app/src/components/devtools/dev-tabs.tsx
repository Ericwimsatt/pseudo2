/**
 * DevTabs container. Renders a tab strip with the currently open
 * development tabs and the active tab's panel. Used at the bottom
 * of the application.
 */

import { useAppStore, type DevTab } from "../../store/app-store.js";
import { SourcePanel } from "../../panels/SourcePanel/source-panel.js";
import { AstPanel } from "../../panels/AstPanel/ast-panel.js";
import { SemanticPanel } from "../../panels/SemanticPanel/semantic-panel.js";
import { EnglishPanel } from "../../panels/EnglishView/english-panel.js";
import { DiagnosticsPanel } from "../../panels/DiagnosticsPanel/diagnostics-panel.js";
import { LogsPanel } from "../../panels/LogsPanel/logs-panel.js";
import { PerformancePanel } from "../../panels/PerformancePanel/performance-panel.js";
import { X } from "../icons.js";

const TAB_LABEL: Record<DevTab, string> = {
  source: "Source",
  ast: "AST",
  semantic: "Semantic",
  english: "English",
  diagnostics: "Diagnostics",
  logs: "Logs",
  performance: "Performance",
};

const renderPanel = (tab: DevTab) => {
  switch (tab) {
    case "source":
      return <SourcePanel />;
    case "ast":
      return <AstPanel />;
    case "semantic":
      return <SemanticPanel />;
    case "english":
      return <EnglishPanel />;
    case "diagnostics":
      return <DiagnosticsPanel />;
    case "logs":
      return <LogsPanel />;
    case "performance":
      return <PerformancePanel />;
  }
};

export const DevTabs = () => {
  const openTabs = useAppStore((s) => s.openDevTabs);
  const activeTab = useAppStore((s) => s.activeDevTab);
  const setActive = useAppStore((s) => s.setActiveTab);
  const closeTab = useAppStore((s) => s.closeTab);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-8 flex items-center px-1 border-b border-line-subtle bg-bg-sunken text-xs">
        {openTabs.map((tab) => (
          <div
            key={tab}
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm mr-1 ${
              activeTab === tab
                ? "bg-bg-panel text-ink-primary border border-line-subtle border-b-bg-panel"
                : "text-ink-secondary hover:bg-bg-raised"
            }`}
            onClick={() => setActive(tab)}
          >
            <span>{TAB_LABEL[tab]}</span>
            <button
              className="text-ink-muted hover:text-ink-primary"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab);
              }}
              aria-label={`Close ${TAB_LABEL[tab]}`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0">{renderPanel(activeTab)}</div>
    </div>
  );
};
