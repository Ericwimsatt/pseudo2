/**
 * A resizable, generic panel container. Panels use this to keep a
 * consistent header and body style. The panel does not own state
 * — its children render the content.
 */

import type { ReactNode } from "react";

export interface PanelProps {
  readonly title: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export const Panel = ({ title, actions, children, className }: PanelProps) => (
  <section className={`panel h-full ${className ?? ""}`}>
    <header className="panel-header">
      <span>{title}</span>
      {actions ? <span className="flex items-center gap-1">{actions}</span> : null}
    </header>
    <div className="panel-body">{children}</div>
  </section>
);
