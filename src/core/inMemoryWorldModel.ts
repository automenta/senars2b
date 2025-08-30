import {CognitiveItem, SemanticAtom} from '../interfaces/types';
import {CognitiveSchema, WorldModel} from './worldModel';

// Simple in-memory implementation of WorldModel for testing
export class InMemoryWorldModel implements WorldModel {
    private atoms: Map<string, SemanticAtom> = new Map();
    private items: Map<string, CognitiveItem> = new Map();
    private schemas: Map<string, CognitiveSchema> = new Map();
    private semanticIndex: Map<string, number[]> = new Map(); // atom_id -> embedding
    private symbolicIndex: Map<string, string> = new Map(); // atom_id -> content string
    private temporalIndex: Map<number, string[]> = new Map(); // timestamp -> item_ids
    private attentionIndex: Map<string, number> = new Map(); // item_id -> durability
    private metaIndex: Map<string, Map<any, Set<string>>> = new Map(); // metaKey -> metaValue -> itemIds

    add_atom(atom: SemanticAtom): string {
        this.atoms.set(atom.id, atom);
        return atom.id;
    }

    add_item(item: CognitiveItem): void {
        this.items.set(item.id, item);
    }

    update_item(item: CognitiveItem): void {
        this.items.set(item.id, item);
    }

    remove_item(id: string): boolean {
        const item = this.items.get(id);
        if (!item) {
            return false;
        }
        this.items.delete(id);
        return true;
    }

    get_atom(id: string): SemanticAtom | null {
        return this.atoms.get(id) || null;
    }

    get_item(id: string): CognitiveItem | null {
        return this.items.get(id) || null;
    }

    query_by_semantic(embedding: number[], k: number): CognitiveItem[] {
        // Simplified implementation - in a real system, this would use ANN search
        const items = Array.from(this.items.values());
        return items.slice(0, Math.min(k, items.length));
    }

    query_by_symbolic(pattern: any, k?: number): CognitiveItem[] {
        // Simplified implementation - in a real system, this would use pattern matching
        const items = Array.from(this.items.values());
        return items.slice(0, Math.min(k || 10, items.length));
    }

    query_by_structure(pattern: any, k?: number): CognitiveItem[] {
        // Simplified implementation - in a real system, this would use structural matching
        const items = Array.from(this.items.values());
        return items.slice(0, Math.min(k || 10, items.length));
    }

    query_by_meta(key: string, value: any): CognitiveItem[] {
        // Simplified implementation - in a real system, this would use an index
        return Array.from(this.items.values()).filter(item => {
            return item.meta && item.meta[key] === value;
        });
    }

    revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null] {
        // Simplified implementation - in a real system, this would use the belief revision engine
        const existing = this.items.get(new_item.id);
        if (existing) {
            this.items.set(new_item.id, new_item);
            return [new_item, null];
        }
        this.items.set(new_item.id, new_item);
        return [new_item, null];
    }

    register_schema_atom(atom: SemanticAtom): CognitiveSchema {
        // Create a simple schema that just returns an empty array
        const schema: CognitiveSchema = {
            atom_id: atom.id,
            apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => {
                return [];
            }
        };
        this.schemas.set(atom.id, schema);
        return schema;
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

    getStatistics(): { atomCount: number; itemCount: number; schemaCount: number; averageItemDurability: number; } {
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

    getItemHistory(itemId: string): CognitiveItem[] {
        // Simplified implementation: filter items based on a meta field
        return Array.from(this.items.values()).filter(item =>
            item.meta && item.meta.historicalRecordFor === itemId
        ).sort((a, b) => b.stamp.timestamp - a.stamp.timestamp);
    }

    getConfidenceDistribution(): { bins: string[]; counts: number[]; } {
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
}