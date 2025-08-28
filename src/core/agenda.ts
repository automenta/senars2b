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
 * Items are sorted by a combined priority score, and task dependencies are handled.
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

        const isNewItem = !this.itemMap.has(item.id);

        // Update or add item
        if (!isNewItem) {
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                this.items[index] = item;
            }
        } else {
            this.items.push(item);
        }
        this.itemMap.set(item.id, item);
        this.sortItemsByPriority();

        // If an item was added or updated, it might unblock others.
        // Resolve any waiting pop promises.
        if (this.waitingQueue.length > 0) {
            const resolver = this.waitingQueue.shift();
            if (resolver) resolver();
        }
    }

    /**
     * Remove and return the highest priority unblocked item from the agenda
     * @returns A promise that resolves to the highest priority unblocked cognitive item
     * @throws Error if agenda is in an invalid state
     */
    async pop(): Promise<CognitiveItem> {
        const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));

        if (unblockedItemIndex !== -1) {
            const item = this.items.splice(unblockedItemIndex, 1)[0];
            this.itemMap.delete(item.id);
            this.trackPopStatistics();
            return item;
        }

        // Return a promise that resolves when an item is added or a dependency is resolved
        return new Promise<CognitiveItem>((resolve, reject) => {
            const timeout = setTimeout(() => {
                // Remove the resolver from the queue before rejecting
                const index = this.waitingQueue.indexOf(resolver);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                }
                reject(new Error('Timeout waiting for an unblocked item to become available'));
            }, 30000); // 30 second timeout

            const resolver = () => {
                clearTimeout(timeout);
                // When resolved, re-run pop to get the unblocked item.
                this.pop().then(resolve).catch(reject);
            };

            this.waitingQueue.push(resolver);
        });
    }

    /**
     * Peek at the highest priority unblocked item without removing it
     * @returns The highest priority unblocked cognitive item or null if agenda is empty
     */
    peek(): CognitiveItem | null {
        const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));
        return unblockedItemIndex !== -1 ? this.items[unblockedItemIndex] : null;
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
            // An update might unblock an item, so we check the waiting queue
            if (this.waitingQueue.length > 0) {
                const resolver = this.waitingQueue.shift();
                if (resolver) resolver();
            }
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
            // An item removal might unblock a dependent task, so we check the waiting queue
            if (this.waitingQueue.length > 0) {
                const resolver = this.waitingQueue.shift();
                if (resolver) resolver();
            }
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
     * Calculate the combined priority of a cognitive item
     * @param item The cognitive item
     * @returns The combined priority score
     */
    private getCombinedPriority(item: CognitiveItem): number {
        const attentionPriority = item.attention.priority;

        if (item.type === 'TASK' && item.task_metadata) {
            const priorityMap = {
                'low': 0.25,
                'medium': 0.5,
                'high': 0.75,
                'critical': 1.0
            };
            const taskPriority = priorityMap[item.task_metadata.priority_level] || 0.5;

            // Give more weight to the explicit task priority
            return (taskPriority * 0.9) + (attentionPriority * 0.1);
        }

        return attentionPriority;
    }

    /**
     * Sort items by priority in descending order (highest first)
     */
    private sortItemsByPriority(): void {
        this.items.sort((a, b) => this.getCombinedPriority(b) - this.getCombinedPriority(a));
    }

    /**
     * Check if a task is blocked by its dependencies.
     * @param item The cognitive item to check.
     * @returns True if the item is a task and one of its dependencies is not met.
     */
    private isBlocked(item: CognitiveItem): boolean {
        if (item.type !== 'TASK' || !item.task_metadata?.dependencies?.length) {
            return false; // Not a task with dependencies, so not blocked.
        }

        for (const depId of item.task_metadata.dependencies) {
            const dependency = this.itemMap.get(depId);
            // If the dependency is still in the agenda, it's not completed yet.
            if (dependency) {
                // A more robust check would be for status === 'completed', but for now,
                // we assume if it's in the agenda, it's not done.
                // This is a simplification until the WorldModel is the source of truth for status.
                if (dependency.task_metadata?.status !== 'completed') {
                    return true;
                }
            }
        }

        return false; // Not blocked.
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