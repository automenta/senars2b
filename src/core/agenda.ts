import { v4 as uuidv4 } from 'uuid';
import { Agenda, CognitiveItem, AttentionValue, UUID } from '../interfaces/types';

/**
 * PriorityAgenda - A priority-based agenda implementation for cognitive items
 * Items are sorted by priority, with higher priority items processed first
 */
export class PriorityAgenda implements Agenda {
    private items: CognitiveItem[] = [];
    private itemMap: Map<UUID, CognitiveItem> = new Map(); // For O(1) lookups
    private waitingQueue: (() => void)[] = [];
    private lastPopTime: number = 0;
    private popCount: number = 0;

    /**
     * Add or update an item in the agenda
     * @param item The cognitive item to add or update
     */
    push(item: CognitiveItem): void {
        // Check if item already exists
        if (this.itemMap.has(item.id)) {
            // Update existing item
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                this.items[index] = item;
                this.itemMap.set(item.id, item);
                this.sortItemsByPriority();
            }
            return;
        }
        
        this.items.push(item);
        this.itemMap.set(item.id, item);
        this.sortItemsByPriority();
        
        // Resolve any waiting pop promises
        if (this.waitingQueue.length > 0) {
            const resolver = this.waitingQueue.shift();
            if (resolver) resolver();
        }
    }

    /**
     * Remove and return the highest priority item from the agenda
     * @returns A promise that resolves to the highest priority cognitive item
     */
    async pop(): Promise<CognitiveItem> {
        if (this.items.length > 0) {
            const item = this.items.shift()!;
            this.itemMap.delete(item.id);
            this.trackPopStatistics();
            return item;
        }
        
        // Return a promise that resolves when an item is added
        return new Promise<CognitiveItem>(resolve => {
            this.waitingQueue.push(() => {
                const item = this.items.shift()!;
                this.itemMap.delete(item.id);
                this.trackPopStatistics();
                resolve(item);
            });
        });
    }

    /**
     * Peek at the highest priority item without removing it
     * @returns The highest priority cognitive item or null if agenda is empty
     */
    peek(): CognitiveItem | null {
        return this.items.length > 0 ? this.items[0] : null;
    }

    /**
     * Get the current size of the agenda
     * @returns The number of items in the agenda
     */
    size(): number {
        return this.items.length;
    }

    /**
     * Update the attention value of an item and re-sort the agenda
     * @param id The ID of the item to update
     * @param newVal The new attention value
     */
    updateAttention(id: UUID, newVal: AttentionValue): void {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index].attention = newVal;
            this.sortItemsByPriority();
        }
    }

    /**
     * Remove an item from the agenda
     * @param id The ID of the item to remove
     * @returns True if the item was removed, false otherwise
     */
    remove(id: UUID): boolean {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.id !== id);
        const removed = this.items.length !== initialLength;
        if (removed) {
            this.itemMap.delete(id);
        }
        return removed;
    }
    
    /**
     * Get an item by ID without removing it from the agenda
     * @param id The ID of the item to retrieve
     * @returns The cognitive item or null if not found
     */
    get(id: UUID): CognitiveItem | null {
        return this.itemMap.get(id) || null;
    }
    
    /**
     * Get statistics about agenda usage
     * @returns Object containing size, pop rate, and average wait time
     */
    getStatistics(): { 
        size: number; 
        popRate: number; 
        averageWaitTime: number;
    } {
        const now = Date.now();
        const timeElapsed = now - this.lastPopTime;
        const popRate = timeElapsed > 0 ? this.popCount / (timeElapsed / 1000) : 0; // pops per second
        
        // Calculate average wait time (simplified)
        const averageWaitTime = this.items.length > 0 ? 
            this.items.reduce((sum, item) => sum + (now - item.stamp.timestamp), 0) / this.items.length : 
            0;
            
        return {
            size: this.items.length,
            popRate,
            averageWaitTime
        };
    }
    
    /**
     * Sort items by priority in descending order (highest first)
     */
    private sortItemsByPriority(): void {
        this.items.sort((a, b) => b.attention.priority - a.attention.priority);
    }
    
    /**
     * Track statistics for pop operations
     */
    private trackPopStatistics(): void {
        this.popCount++;
        this.lastPopTime = Date.now();
    }
}