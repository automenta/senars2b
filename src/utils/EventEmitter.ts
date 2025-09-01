/**
 * Generic event emitter for consistent event handling across components
 */

export type EventHandler<T> = (event: T) => void;

export class EventEmitter<EventMap extends Record<string, any>> {
  private eventListeners: Map<keyof EventMap, Array<EventHandler<any>>> = new Map();

  /**
   * Add an event listener for a specific event type
   */
  on<K extends keyof EventMap>(eventType: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(handler);
  }

  /**
   * Remove an event listener for a specific event type
   */
  off<K extends keyof EventMap>(eventType: K, handler: EventHandler<EventMap[K]>): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  emit<K extends keyof EventMap>(eventType: K, event: EventMap[K]): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${String(eventType)}:`, error);
        }
      }
    }
  }

  /**
   * Get the number of listeners for a specific event type
   */
  listenerCount<K extends keyof EventMap>(eventType: K): number {
    return this.eventListeners.get(eventType)?.length || 0;
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListeners<K extends keyof EventMap>(eventType: K): void {
    this.eventListeners.delete(eventType);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.eventListeners.clear();
  }
}