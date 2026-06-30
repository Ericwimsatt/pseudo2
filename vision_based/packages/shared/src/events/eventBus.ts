export type EventHandler<T = unknown> = (data: T) => void

export interface EventSubscription {
  unsubscribe(): void
}

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  on<T>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)

    return {
      unsubscribe: () => {
        this.handlers.get(event)?.delete(handler as EventHandler)
      }
    }
  }

  emit<T>(event: string, data: T): void {
    this.handlers.get(event)?.forEach(handler => handler(data))
  }

  off(event: string, handler?: EventHandler): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler)
    } else {
      this.handlers.delete(event)
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const globalEventBus = new EventBus()
