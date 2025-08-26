import { WorldModel, SemanticAtom, CognitiveItem, TruthValue, CognitiveSchema, UUID } from './types';

// Simple in-memory implementation of WorldModel for testing
export class InMemoryWorldModel implements WorldModel {
    private atoms: Map<UUID, SemanticAtom> = new Map();
    private items: Map<UUID, CognitiveItem> = new Map();
    private schemas: Map<UUID, CognitiveSchema> = new Map();

    add_atom(atom: SemanticAtom): UUID {
        this.atoms.set(atom.id, atom);
        return atom.id;
    }

    add_item(item: CognitiveItem): void {
        this.items.set(item.id, item);
    }

    get_atom(id: UUID): SemanticAtom | null {
        return this.atoms.get(id) || null;
    }

    get_item(id: UUID): CognitiveItem | null {
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

    revise_belief(new_item: CognitiveItem): CognitiveItem | null {
        // Simplified implementation - in a real system, this would use the belief revision engine
        const existing = this.items.get(new_item.id);
        if (existing) {
            this.items.set(new_item.id, new_item);
            return new_item;
        }
        this.items.set(new_item.id, new_item);
        return new_item;
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
}