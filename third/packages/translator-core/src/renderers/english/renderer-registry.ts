/**
 * Registry of English renderers. Most apps will only ever have one,
 * but a registry keeps the door open for pluggable strategies
 * (terse, verbose, localised).
 */

import type { EnglishRenderer } from "./english-renderer.js";

export class EnglishRendererRegistry {
  private readonly renderers = new Map<string, EnglishRenderer>();
  private activeId: string | null = null;

  register(renderer: EnglishRenderer): void {
    this.renderers.set(renderer.id, renderer);
    if (this.activeId === null) this.activeId = renderer.id;
  }

  unregister(id: string): void {
    this.renderers.delete(id);
    if (this.activeId === id) {
      const first = this.renderers.keys().next();
      this.activeId = first.done ? null : first.value;
    }
  }

  list(): readonly EnglishRenderer[] {
    return Array.from(this.renderers.values());
  }

  active(): EnglishRenderer | null {
    return this.activeId ? (this.renderers.get(this.activeId) ?? null) : null;
  }

  setActive(id: string): void {
    if (!this.renderers.has(id)) {
      throw new Error(`English renderer "${id}" is not registered.`);
    }
    this.activeId = id;
  }
}
