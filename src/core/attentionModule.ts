import {
    Agenda
} from './agenda';
import {
    CognitiveSchema,
    WorldModel
} from './worldModel';
import {
    AttentionValue,
    CognitiveItem
} from '../interfaces/types';

export interface AttentionModule {
    calculate_initial(item: CognitiveItem): AttentionValue;
    calculate_derived(
        parents: CognitiveItem[],
        schema: CognitiveSchema,
        source_trust?: number
    ): AttentionValue;
    update_on_access(items: CognitiveItem[]): void;
    run_decay_cycle(world_model: WorldModel, agenda: Agenda): void;
}

export class DynamicAttentionModule implements AttentionModule {
    private accessHistory: Map<string, { timestamp: number; count: number }[]> = new Map();
    private decayFactors: Map<string, number> = new Map(); // item_id -> decay_factor

    calculate_initial(item: CognitiveItem): AttentionValue {
        // Calculate initial attention based on item properties
        const baseValues = {
            'GOAL': {priority: 0.8, durability: 0.7},
            'BELIEF': {priority: 0.6, durability: 0.8},
            'QUERY': {priority: 0.7, durability: 0.6},
            'EVENT': {priority: 0.5, durability: 0.5},
            'TASK': {priority: 0.6, durability: 0.6}
        }[item.type] || {priority: 0.5, durability: 0.5};

        let {priority, durability} = baseValues;

        // Adjust based on truth values for beliefs
        if (item.type === 'BELIEF' && item.truth) {
            const confidenceFactor = 0.5 + item.truth.confidence * 0.5;
            priority *= confidenceFactor;
            durability *= confidenceFactor;
        }

        // Adjust based on goal status for goals
        if (item.type === 'GOAL' && item.goal_status) {
            const statusFactors = {
                'active': {priority: 1.0, durability: 1.0},
                'achieved': {priority: 0.3, durability: 0.8},
                'failed': {priority: 0.2, durability: 0.5},
                'blocked': {priority: 0.5, durability: 0.7}
            }[item.goal_status] || {priority: 1.0, durability: 1.0};

            priority *= statusFactors.priority;
            durability *= statusFactors.durability;
        }

        return {
            priority: Math.min(1.0, priority),
            durability: Math.min(1.0, durability)
        };
    }

    calculate_derived(
        parents: CognitiveItem[],
        schema: CognitiveSchema,
        source_trust?: number
    ): AttentionValue {
        // Calculate attention for derived items
        if (parents.length === 0) {
            return {priority: 0.5, durability: 0.5};
        }

        // Base calculation on parent attention values
        const avgPriority = parents.reduce((sum, p) => sum + p.attention.priority, 0) / parents.length;
        const avgDurability = parents.reduce((sum, p) => sum + p.attention.durability, 0) / parents.length;

        // Apply source trust factor
        const trustFactor = source_trust !== undefined ? source_trust : 1.0;

        // Novelty bonus for derived items (decreases with more derivations)
        const noveltyBonus = Math.max(0.01, 0.1 / (parents.length || 1));

        // Inhibition factor for frequently derived items (prevents runaway reasoning)
        const inhibitionFactor = this.calculateInhibitionFactor(schema.atom_id);

        return {
            priority: Math.min(1.0, avgPriority * trustFactor * inhibitionFactor + noveltyBonus),
            durability: Math.min(1.0, avgDurability * trustFactor + noveltyBonus)
        };
    }

    update_on_access(items: CognitiveItem[]): void {
        // Update attention values based on access frequency and recency
        const now = Date.now();

        for (const item of items) {
            // Record access
            this.recordAccess(item.id, now);

            // Increase priority slightly with each access (saturation effect)
            const currentPriority = item.attention.priority;
            const accessCount = this.getRecentAccessCount(item.id, now);
            const priorityBoost = Math.min(0.1, 0.01 * Math.log(accessCount + 1));
            item.attention.priority = Math.min(1.0, currentPriority + priorityBoost);

            // Increase durability for frequently accessed items
            if (accessCount > 3) { // If accessed more than 3 times recently
                item.attention.durability = Math.min(1.0, item.attention.durability + 0.02);
            }
        }
    }

    run_decay_cycle(world_model: WorldModel, agenda: Agenda): void {
        // Decay attention values over time based on inactivity
        const now = Date.now();
        const decayThreshold = 5 * 60 * 1000; // 5 minutes

        // Get all items from the world model (simplified approach)
        // In a real implementation, we would have a more efficient way to iterate
        try {
            // Apply decay to items based on time since last access
            for (const [itemId, accessHistory] of this.accessHistory.entries()) {
                if (accessHistory.length > 0) {
                    const lastAccess = accessHistory[accessHistory.length - 1].timestamp;
                    const timeSinceAccess = now - lastAccess;

                    if (timeSinceAccess > decayThreshold) {
                        // Try to get item from agenda first
                        let item: CognitiveItem | null = null;
                        if ((agenda as any).get) {
                            item = (agenda as any).get(itemId);
                        }

                        // If not in agenda, try to get from world model
                        if (!item) {
                            const worldItem = (world_model as any).get_item ?
                                (world_model as any).get_item(itemId) : null;
                            if (worldItem) item = worldItem;
                        }

                        if (item) {
                            // Apply exponential decay
                            const decayFactor = Math.exp(-timeSinceAccess / (30 * 60 * 1000)); // 30-minute half-life
                            item.attention.priority *= decayFactor;
                            item.attention.durability *= decayFactor;

                            // Ensure values don't go below minimum thresholds
                            item.attention.priority = Math.max(0.01, item.attention.priority);
                            item.attention.durability = Math.max(0.01, item.attention.durability);

                            // Update item in agenda/world model if needed
                            if ((agenda as any).updateAttention) {
                                (agenda as any).updateAttention(item.id, item.attention);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn("Error during attention decay cycle:", error);
        }
    }

    private recordAccess(itemId: string, timestamp: number): void {
        // Record an access event for an item
        if (!this.accessHistory.has(itemId)) {
            this.accessHistory.set(itemId, []);
        }

        const history = this.accessHistory.get(itemId)!;
        history.push({timestamp, count: 1});

        // Keep only recent history (last 100 accesses)
        if (history.length > 100) {
            this.accessHistory.set(itemId, history.slice(-100));
        }
    }

    private getRecentAccessCount(itemId: string, now: number): number {
        // Count accesses in the last 10 minutes
        const tenMinutesAgo = now - (10 * 60 * 1000);

        const history = this.accessHistory.get(itemId) || [];
        return history.filter(record => record.timestamp > tenMinutesAgo).length;
    }

    private calculateInhibitionFactor(schemaId: string): number {
        // Calculate inhibition factor to prevent runaway reasoning
        // Based on how frequently this schema has been used recently
        const recentUsage = this.getRecentSchemaUsage(schemaId);
        // Exponential inhibition - the more it's used, the more inhibited it becomes
        return Math.exp(-recentUsage / 10); // 10 usages = ~37% inhibition
    }

    private getRecentSchemaUsage(schemaId: string): number {
        // Count how many times a schema has been used recently
        // In a real implementation, we'd track schema usage separately
        // For now, we'll use a placeholder that returns a small random value
        return Math.floor(Math.random() * 3);
    }
}
