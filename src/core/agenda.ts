import {AttentionValue, CognitiveItem} from '../interfaces/types';

export interface Agenda {
    push(item: CognitiveItem): void;
    pop(): Promise<CognitiveItem>;
    peek(): CognitiveItem | null;
    size(): number;
    updateAttention(id: string, newVal: AttentionValue): void;
    remove(id: string): boolean;
    get(id: string): CognitiveItem | null;
}

/**
 * PriorityAgenda - A priority-based agenda implementation for cognitive items
 * Items are sorted by priority, with higher priority items processed first
 */
export class PriorityAgenda implements Agenda {
    private items: CognitiveItem[] = [];
    private itemMap: Map<string, CognitiveItem> = new Map(); // For O(1) lookups
    private waitingQueue: (() => void)[] = [];
    private lastPopTime: number = 0;
    private popCount: number = 0;
    private totalWaitTime: number = 0;
    private maxWaitTime: number = 0;

    /**
     * Add or update an item in the agenda
     * @param item The cognitive item to add or update
     * @throws Error if item is null or undefined
     */
    push(item: CognitiveItem): void {
        // Validate input
        if (!item) {
            throw new Error('Cannot add null or undefined item to agenda');
        }
        
        if (!item.id) {
            throw new Error('Item must have an ID');
        }
        
        if (!item.attention) {
            throw new Error('Item must have an attention value');
        }
        
        if (typeof item.attention.priority !== 'number' || item.attention.priority < 0 || item.attention.priority > 1) {
            throw new Error('Item attention priority must be a number between 0 and 1');
        }

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
     * @throws Error if agenda is in an invalid state
     */
    async pop(): Promise<CognitiveItem> {
        if (this.items.length > 0) {
            const item = this.items.shift()!;
            this.itemMap.delete(item.id);
            this.trackPopStatistics();
            return item;
        }

        // Return a promise that resolves when an item is added
        return new Promise<CognitiveItem>((resolve, reject) => {
            // Set a timeout to prevent indefinite waiting
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for item to be added to agenda'));
            }, 30000); // 30 second timeout
            
            this.waitingQueue.push(() => {
                clearTimeout(timeout);
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
    updateAttention(id: string, newVal: AttentionValue): void {
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
    remove(id: string): boolean {
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
    get(id: string): CognitiveItem | null {
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
        maxWaitTime: number;
        totalPops: number;
    } {
        const now = Date.now();
        const timeElapsed = now - this.lastPopTime;
        const popRate = timeElapsed > 0 ? this.popCount / (timeElapsed / 1000) : 0; // pops per second

        // Calculate average wait time (simplified)
        const totalWaitTime = this.items.reduce((sum, item) => sum + (now - item.stamp.timestamp), 0);
        const averageWaitTime = this.items.length > 0 ? totalWaitTime / this.items.length : 0;

        return {
            size: this.items.length,
            popRate,
            averageWaitTime,
            maxWaitTime: this.maxWaitTime,
            totalPops: this.popCount
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
        const now = Date.now();
        this.popCount++;
        
        if (this.lastPopTime > 0) {
            const waitTime = now - this.lastPopTime;
            this.totalWaitTime += waitTime;
            if (waitTime > this.maxWaitTime) {
                this.maxWaitTime = waitTime;
            }
        }
        
        this.lastPopTime = now;
    }
}