/**
 * The top-level application layout. Inspired by common desktop IDEs:
 * a toolbar, a three-column body (sidebar | main | inspector), and a
 * bottom row of development panels.
 */

import type { ReactNode } from "react";

export interface AppLayoutProps {
  readonly toolbar: ReactNode;
  readonly sidebar: ReactNode;
  readonly main: ReactNode;
  readonly inspector: ReactNode;
  readonly devTabs: ReactNode;
}

export const AppLayout = (props: AppLayoutProps) => {
  return (
    <div className="flex h-full w-full flex-col bg-bg-base text-ink-primary">
      <div className="h-10 border-b border-line-subtle bg-bg-panel shrink-0">{props.toolbar}</div>
      <div className="flex flex-1 min-h-0">
        <aside className="w-72 border-r border-line-subtle bg-bg-panel shrink-0 flex flex-col min-h-0">
          {props.sidebar}
        </aside>
        <main className="flex-1 min-w-0 flex flex-col bg-bg-base">
          <div className="flex-1 min-h-0">{props.main}</div>
          <div className="h-72 border-t border-line-subtle bg-bg-panel shrink-0">{props.devTabs}</div>
        </main>
        <aside className="w-80 border-l border-line-subtle bg-bg-panel shrink-0 flex flex-col min-h-0">
          {props.inspector}
        </aside>
      </div>
    </div>
  );
};
