import { v4 as uuidv4 } from 'uuid';
import { Agenda, CognitiveItem, AttentionValue, UUID } from '../interfaces/types';

export class PriorityAgenda implements Agenda {
    private items: CognitiveItem[] = [];
    private itemMap: Map<UUID, CognitiveItem> = new Map(); // For O(1) lookups
    private waitingQueue: (() => void)[] = [];
    private lastPopTime: number = 0;
    private popCount: number = 0;

    push(item: CognitiveItem): void {
        // Check if item already exists
        if (this.itemMap.has(item.id)) {
            // Update existing item
            const index = this.items.findIndex(i => i.id === item.id);
            if (index !== -1) {
                this.items[index] = item;
                this.itemMap.set(item.id, item);
                this.items.sort((a, b) => b.attention.priority - a.attention.priority);
            }
            return;
        }
        
        this.items.push(item);
        this.itemMap.set(item.id, item);
        this.items.sort((a, b) => b.attention.priority - a.attention.priority);
        
        // Resolve any waiting pop promises
        if (this.waitingQueue.length > 0) {
            const resolver = this.waitingQueue.shift();
            if (resolver) resolver();
        }
    }

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

    peek(): CognitiveItem | null {
        return this.items.length > 0 ? this.items[0] : null;
    }

    size(): number {
        return this.items.length;
    }

    updateAttention(id: UUID, newVal: AttentionValue): void {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index].attention = newVal;
            this.items.sort((a, b) => b.attention.priority - a.attention.priority);
        }
    }

    remove(id: UUID): boolean {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.id !== id);
        const removed = this.items.length !== initialLength;
        if (removed) {
            this.itemMap.delete(id);
        }
        return removed;
    }
    
    // Get item by ID without removing it
    get(id: UUID): CognitiveItem | null {
        return this.itemMap.get(id) || null;
    }
    
    // Get statistics about agenda usage
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
    
    private trackPopStatistics(): void {
        this.popCount++;
        this.lastPopTime = Date.now();
    }
}