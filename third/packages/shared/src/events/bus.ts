/**
 * Minimal typed event bus. Used by controllers to communicate with one
 * another and with the React layer without coupling to any specific
 * transport (Zustand, etc).
 *
 * - No dependencies on React or DOM
 * - Synchronous delivery
 * - Handlers can be removed
 */

export type Unsubscribe = () => void;

export class TypedEventBus<EventMap extends Record<string, unknown>> {
  private readonly handlers: Map<keyof EventMap, Set<(payload: unknown) => void>> = new Map();

  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): Unsubscribe {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    const wrapped = handler as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        (handler as (p: EventMap[K]) => void)(payload);
      } catch (cause) {
        // Event handlers must not break the bus; report and continue.
        // eslint-disable-next-line no-console
        console.error(`[event-bus] handler for "${String(event)}" threw`, cause);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
