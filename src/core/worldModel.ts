import {
    CognitiveItem,
    SemanticAtom
} from '../interfaces/types';
import {v4 as uuidv4} from 'uuid';
import {BeliefRevisionEngine, SimpleBeliefRevisionEngine} from './beliefRevisionEngine';
import {CognitiveItemFactory} from '../modules/cognitiveItemFactory';

export type CognitiveSchema = {
    atom_id: string;
    apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => CognitiveItem[];
};

export interface WorldModel {
    add_atom(atom: SemanticAtom): string;
    add_item(item: CognitiveItem): void;
    update_item(item: CognitiveItem): void;
    remove_item(id: string): boolean;
    get_atom(id: string): SemanticAtom | null;
    get_item(id: string): CognitiveItem | null;
    query_by_semantic(embedding: number[], k: number): CognitiveItem[];
    query_by_symbolic(pattern: any, k?: number): CognitiveItem[];
    query_by_structure(pattern: any, k?: number): CognitiveItem[];
    query_by_meta(key: string, value: any): CognitiveItem[];
    query_atoms_by_meta(key: string, value: any): SemanticAtom[];
    revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null];
    register_schema_atom(atom: SemanticAtom): CognitiveSchema;
    getStatistics(): {
        atomCount: number;
        itemCount: number;
        schemaCount: number;
        averageItemDurability: number;
    };
    getItemHistory(itemId: string): CognitiveItem[];
    getConfidenceDistribution(): { bins: string[], counts: number[] };
    getAllItems(): CognitiveItem[];
}

export class PersistentWorldModel implements WorldModel {
    private atoms: Map<string, SemanticAtom> = new Map();
    private items: Map<string, CognitiveItem> = new Map();
    private schemas: Map<string, CognitiveSchema> = new Map();
    private beliefRevisionEngine: BeliefRevisionEngine;

    // Multi-index structures
    private semanticIndex: Map<string, number[]> = new Map(); // atom_id -> embedding
    private symbolicIndex: Map<string, string> = new Map(); // atom_id -> content string
    private temporalIndex: Map<number, string[]> = new Map(); // timestamp -> item_ids
    private attentionIndex: Map<string, number> = new Map(); // item_id -> durability
    private metaIndex: Map<string, Map<any, Set<string>>> = new Map(); // metaKey -> metaValue -> itemIds

    constructor() {
        this.beliefRevisionEngine = new SimpleBeliefRevisionEngine();
    }

    add_atom(atom: SemanticAtom): string {
        // Validate input
        if (!atom) {
            throw new Error('Cannot add null or undefined atom to world model');
        }
        
        if (!atom.id) {
            throw new Error('Atom must have an ID');
        }
        
        if (atom.embedding && !Array.isArray(atom.embedding)) {
            throw new Error('Atom embedding must be an array');
        }

        this.atoms.set(atom.id, atom);

        // Update indexes
        this.semanticIndex.set(atom.id, atom.embedding);
        this.symbolicIndex.set(
            atom.id,
            typeof atom.content === 'string' ? atom.content : JSON.stringify(atom.content)
        );

        return atom.id;
    }

    add_item(item: CognitiveItem): void {
        // Validate input
        if (!item) {
            throw new Error('Cannot add null or undefined item to world model');
        }
        
        if (!item.id) {
            throw new Error('Item must have an ID');
        }
        
        if (!item.atom_id) {
            throw new Error('Item must have an atom_id');
        }
        
        if (!item.type) {
            throw new Error('Item must have a type');
        }
        
        if (!item.stamp) {
            throw new Error('Item must have a stamp');
        }

        this.items.set(item.id, item);

        // Update indexes
        this.attentionIndex.set(item.id, item.attention.durability);

        // Update temporal index
        const timestamp = Math.floor(item.stamp.timestamp / 1000); // Group by second
        if (!this.temporalIndex.has(timestamp)) {
            this.temporalIndex.set(timestamp, []);
        }
        this.temporalIndex.get(timestamp)!.push(item.id);

        // Update meta index
        if (item.meta) {
            for (const [key, value] of Object.entries(item.meta)) {
                if (!this.metaIndex.has(key)) {
                    this.metaIndex.set(key, new Map());
                }
                const valueMap = this.metaIndex.get(key)!;
                if (!valueMap.has(value)) {
                    valueMap.set(value, new Set());
                }
                valueMap.get(value)!.add(item.id);
            }
        }
    }

    get_atom(id: string): SemanticAtom | null {
        return this.atoms.get(id) || null;
    }

    get_item(id: string): CognitiveItem | null {
        return this.items.get(id) || null;
    }

    update_item(item: CognitiveItem): void {
        if (!this.items.has(item.id)) {
            // For now, we'll allow updates to also function as an add.
            // A stricter implementation might throw an error here.
        }
        this.items.set(item.id, item);

        // Update relevant indexes
        this.attentionIndex.set(item.id, item.attention.durability);
        // Note: a full implementation should also update metaIndex and temporalIndex if relevant fields change.
    }

    remove_item(id: string): boolean {
        const item = this.items.get(id);
        if (!item) {
            return false;
        }

        this.items.delete(id);

        // Remove from indexes
        this.attentionIndex.delete(id);

        const timestamp = Math.floor(item.stamp.timestamp / 1000);
        const itemsAtTime = this.temporalIndex.get(timestamp);
        if (itemsAtTime) {
            const index = itemsAtTime.indexOf(id);
            if (index > -1) {
                itemsAtTime.splice(index, 1);
            }
        }

        if (item.meta) {
            for (const [key, value] of Object.entries(item.meta)) {
                const valueMap = this.metaIndex.get(key);
                if (valueMap) {
                    const idSet = valueMap.get(value);
                    if (idSet) {
                        idSet.delete(id);
                    }
                }
            }
        }
        return true;
    }

    query_by_semantic(embedding: number[], k: number): CognitiveItem[] {
        // More sophisticated semantic matching implementation using the index
        const similarities = Array.from(this.semanticIndex.entries()).map(([atomId, atomEmbedding]) => {
            const similarity = this.calculateCosineSimilarity(embedding, atomEmbedding);
            return {atomId, similarity};
        });

        // Sort by similarity (descending) and get top k atom IDs
        const topAtoms = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k)
            .map(x => x.atomId);

        // Get corresponding items
        return topAtoms
            .map(atomId => {
                // Find items that reference this atom
                return Array.from(this.items.values()).find(item => item.atom_id === atomId);
            })
            .filter(item => item !== undefined) as CognitiveItem[];
    }

    query_by_symbolic(pattern: any, k: number = 10): CognitiveItem[] {
        // Pattern matching implementation using the index
        const patternStr = typeof pattern === 'string' ? pattern : JSON.stringify(pattern).toLowerCase();

        // Score atoms based on symbolic match
        const scoredAtoms = Array.from(this.symbolicIndex.entries()).map(([atomId, content]) => {
            const score = this.calculateStringOverlap(patternStr, content.toLowerCase());
            return {atomId, score};
        });

        // Sort by score (descending) and get top k atom IDs
        const topAtoms = scoredAtoms
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(x => x.atomId);

        // Get corresponding items
        return topAtoms
            .map(atomId => {
                // Find items that reference this atom
                return Array.from(this.items.values()).find(item => item.atom_id === atomId);
            })
            .filter(item => item !== undefined) as CognitiveItem[];
    }

    query_by_structure(pattern: any, k: number = 10): CognitiveItem[] {
        // Structural pattern matching
        const items = Array.from(this.items.values());

        // Score items based on structural match
        const scoredItems = items.map(item => {
            const atom = this.get_atom(item.atom_id);
            if (!atom) return {item, score: 0};

            // Calculate structural similarity
            const score = this.calculateStructuralSimilarity(atom.content, pattern);
            return {item, score};
        });

        // Sort by score (descending) and return top k
        return scoredItems
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(x => x.item);
    }

    revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null] {
        if (!new_item.truth) return [null, null];

        const existing = this.items.get(new_item.id);
        let event: CognitiveItem | null = null;

        if (existing && existing.truth) {
            const oldTruth = {...existing.truth};
            let revisedItem: CognitiveItem;

            // Check for conflict
            if (this.beliefRevisionEngine.detect_conflict(existing.truth, new_item.truth)) {
                console.warn(`Conflict detected between beliefs for item ${new_item.id}`);
                revisedItem = (this.beliefRevisionEngine as any).resolve_conflict(existing, new_item);
            } else {
                // Merge the beliefs
                const mergedTruth = this.beliefRevisionEngine.merge(existing.truth, new_item.truth);
                revisedItem = {...existing, truth: mergedTruth};
            }

            // Update the item in the world model
            this.items.set(revisedItem.id, revisedItem);

            // Update index
            this.attentionIndex.set(revisedItem.id, revisedItem.attention.durability);

            // Create the BeliefUpdated event
            event = CognitiveItemFactory.createEvent(
                'BeliefUpdated',
                {
                    itemId: revisedItem.id,
                    oldTruth: oldTruth,
                    newTruth: revisedItem.truth
                },
                {priority: 0.8, durability: 0.5} // System-level event attention
            );

            return [revisedItem, event];
        }

        // Add new belief if it doesn't exist
        this.add_item(new_item);
        return [new_item, null];
    }

    register_schema_atom(atom: SemanticAtom): CognitiveSchema {
        // Create a schema implementation that uses the schema's own apply function if available
        const schema: CognitiveSchema = {
            atom_id: atom.id,
            apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => {
                // Use the schema's own apply function if it exists
                if (atom.content && typeof atom.content === 'object' && 'apply' in atom.content) {
                    try {
                        return (atom.content as any).apply(a, b, worldModel);
                    } catch (error) {
                        console.warn(`Schema ${atom.id} apply function failed:`, error);
                        return [];
                    }
                }

                // Fallback to default schema application based on schema type
                const schemaName = atom.content?.name || '';

                if (schemaName === 'EnhancedAnalogyHypothesis') {
                    // Create a query based on analogy
                    const newItem = {
                        id: uuidv4(),
                        atom_id: atom.id,
                        type: 'QUERY' as const,
                        attention: {
                            priority: 0.7,
                            durability: 0.6
                        },
                        stamp: {
                            timestamp: Date.now(),
                            parent_ids: [a.id, b.id],
                            schema_id: atom.id,
                            module: 'analogy'
                        },
                        label: `Analogy-based query from items ${a.id} and ${b.id}`
                    };
                    return [newItem];
                } else if (schemaName === 'EnhancedCausalInference') {
                    // Create a belief based on causal inference
                    const newItem = {
                        id: uuidv4(),
                        atom_id: atom.id,
                        type: 'BELIEF' as const,
                        truth: {
                            frequency: 0.8,
                            confidence: 0.7
                        },
                        attention: {
                            priority: 0.6,
                            durability: 0.7
                        },
                        stamp: {
                            timestamp: Date.now(),
                            parent_ids: [a.id, b.id],
                            schema_id: atom.id,
                            module: 'causal'
                        },
                        label: `Causal inference from items ${a.id} and ${b.id}`
                    };
                    return [newItem];
                } else {
                    // Default schema application
                    const newItem = {
                        id: uuidv4(),
                        atom_id: atom.id,
                        type: 'QUERY' as const,
                        attention: {
                            priority: 0.7,
                            durability: 0.6
                        },
                        stamp: {
                            timestamp: Date.now(),
                            parent_ids: [a.id, b.id],
                            schema_id: atom.id
                        }
                    };
                    return [newItem];
                }
            }
        };
        this.schemas.set(atom.id, schema);
        return schema;
    }

    // Additional query methods for the multi-index structure
    query_by_temporal(startTime: number, endTime: number): CognitiveItem[] {
        const items: CognitiveItem[] = [];

        // Iterate through the time range
        for (let ts = startTime; ts <= endTime; ts++) {
            const itemIds = this.temporalIndex.get(ts) || [];
            for (const itemId of itemIds) {
                const item = this.items.get(itemId);
                if (item) {
                    items.push(item);
                }
            }
        }

        return items;
    }

    query_by_attention(minDurability: number): CognitiveItem[] {
        return Array.from(this.items.values()).filter(
            item => item.attention.durability >= minDurability
        );
    }

    // Compaction method for memory management
    compact(): void {
        // Remove items with very low durability that are old
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        for (const [id, item] of this.items.entries()) {
            if (item.attention.durability < 0.1 && item.stamp.timestamp < oneDayAgo) {
                this.items.delete(id);
                this.attentionIndex.delete(id);

                // Remove from temporal index
                const timestamp = Math.floor(item.stamp.timestamp / 1000);
                const itemsAtTime = this.temporalIndex.get(timestamp);
                if (itemsAtTime) {
                    const filtered = itemsAtTime.filter(itemId => itemId !== id);
                    if (filtered.length > 0) {
                        this.temporalIndex.set(timestamp, filtered);
                    } else {
                        this.temporalIndex.delete(timestamp);
                    }
                }
            }
        }
    }

    query_by_meta(key: string, value: any): CognitiveItem[] {
        const valueMap = this.metaIndex.get(key);
        if (!valueMap) return [];

        const itemIds = valueMap.get(value);
        if (!itemIds) return [];

        return Array.from(itemIds)
            .map(id => this.items.get(id))
            .filter((item): item is CognitiveItem => item !== undefined);
    }

    query_atoms_by_meta(key: string, value: any): SemanticAtom[] {
        const results: SemanticAtom[] = [];
        for (const atom of this.atoms.values()) {
            if (atom.meta && atom.meta[key] === value) {
                results.push(atom);
            }
        }
        return results;
    }

    getItemHistory(itemId: string): CognitiveItem[] {
        const historyItems = this.query_by_meta('historicalRecordFor', itemId);
        // Sort by timestamp descending to get the most recent history first
        return historyItems.sort((a, b) => b.stamp.timestamp - a.stamp.timestamp);
    }

    getConfidenceDistribution(): { bins: string[], counts: number[] } {
        const beliefs = Array.from(this.items.values()).filter(
            item => item.type === 'BELIEF' && item.truth
        );

        const binCount = 10;
        const bins = Array.from({length: binCount}, (_, i) => {
            const lower = (i / binCount).toFixed(1);
            const upper = ((i + 1) / binCount).toFixed(1);
            return `${lower}-${upper}`;
        });
        const counts = Array(binCount).fill(0);

        for (const belief of beliefs) {
            if (belief.truth) {
                const confidence = belief.truth.confidence;
                const binIndex = Math.min(Math.floor(confidence * binCount), binCount - 1);
                counts[binIndex]++;
            }
        }

        return {bins, counts};
    }

    getAllItems(): CognitiveItem[] {
        return Array.from(this.items.values());
    }

    // Get statistics about the world model
    getStatistics(): {
        atomCount: number;
        itemCount: number;
        schemaCount: number;
        averageItemDurability: number;
    } {
        const durabilities = Array.from(this.items.values()).map(item => item.attention.durability);
        const avgDurability = durabilities.length > 0
            ? durabilities.reduce((a, b) => a + b, 0) / durabilities.length
            : 0;

        return {
            atomCount: this.atoms.size,
            itemCount: this.items.size,
            schemaCount: this.schemas.size,
            averageItemDurability: avgDurability
        };
    }

    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length || a.length === 0) return 0;

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }

    private calculateStringOverlap(pattern: string, content: string): number {
        // Simple string overlap calculation using Jaccard similarity
        const patternWords = new Set(pattern.toLowerCase().split(/\W+/).filter(w => w.length > 0));
        const contentWords = new Set(content.toLowerCase().split(/\W+/).filter(w => w.length > 0));

        const intersection = new Set([...patternWords].filter(x => contentWords.has(x)));
        const union = new Set([...patternWords, ...contentWords]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    private calculateStructuralSimilarity(obj: any, pattern: any): number {
        // Calculate structural similarity between two objects
        if (typeof pattern !== 'object' || pattern === null) {
            return typeof obj === typeof pattern ? 1 : 0;
        }

        if (typeof obj !== 'object' || obj === null) {
            return 0;
        }

        // Count matching keys
        const patternKeys = Object.keys(pattern);
        const objKeys = Object.keys(obj);
        const commonKeys = patternKeys.filter(key => objKeys.includes(key));

        if (patternKeys.length === 0) return objKeys.length === 0 ? 1 : 0;

        // Calculate key matching score
        const keyMatchScore = commonKeys.length / Math.max(patternKeys.length, objKeys.length);

        // Calculate value matching score for common keys
        let valueMatchScore = 0;
        if (commonKeys.length > 0) {
            valueMatchScore = commonKeys.reduce((score, key) => {
                return score + this.calculateStructuralSimilarity(obj[key], pattern[key]);
            }, 0) / commonKeys.length;
        }

        // Weighted combination
        return 0.3 * keyMatchScore + 0.7 * valueMatchScore;
    }
}