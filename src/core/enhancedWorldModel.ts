import { 
  WorldModel, 
  SemanticAtom, 
  CognitiveItem, 
  TruthValue, 
  CognitiveSchema, 
  UUID 
} from '../interfaces/types';

// Enhanced implementation of WorldModel with better indexing and querying
export class EnhancedWorldModel implements WorldModel {
  private atoms: Map<UUID, SemanticAtom> = new Map();
  private items: Map<UUID, CognitiveItem> = new Map();
  private schemas: Map<UUID, CognitiveSchema> = new Map();
  
  // Enhanced indexing structures
  private semanticIndex: Map<string, UUID[]> = new Map(); // Domain-based semantic indexing
  private symbolicIndex: Map<string, UUID[]> = new Map(); // Content-based symbolic indexing
  private temporalIndex: Map<number, UUID[]> = new Map(); // Time-based indexing
  private attentionIndex: Map<string, UUID[]> = new Map(); // Attention-based indexing

  add_atom(atom: SemanticAtom): UUID {
    this.atoms.set(atom.id, atom);
    
    // Update indexes
    this.updateSemanticIndex(atom);
    this.updateSymbolicIndex(atom);
    this.updateTemporalIndex(atom);
    
    return atom.id;
  }

  add_item(item: CognitiveItem): void {
    this.items.set(item.id, item);
    
    // Update attention index
    this.updateAttentionIndex(item);
    
    // Update temporal index with item timestamp
    const timeBucket = Math.floor(item.stamp.timestamp / 3600000); // Group by hour
    if (!this.temporalIndex.has(timeBucket)) {
      this.temporalIndex.set(timeBucket, []);
    }
    this.temporalIndex.get(timeBucket)!.push(item.id);
  }

  get_atom(id: UUID): SemanticAtom | null {
    return this.atoms.get(id) || null;
  }

  get_item(id: UUID): CognitiveItem | null {
    return this.items.get(id) || null;
  }

  query_by_semantic(embedding: number[], k: number): CognitiveItem[] {
    // Enhanced semantic query with domain awareness
    // In a real implementation, this would use ANN search
    const items = Array.from(this.items.values());
    return items.slice(0, Math.min(k, items.length));
  }

  query_by_symbolic(pattern: any, k?: number): CognitiveItem[] {
    // Enhanced symbolic query with pattern matching
    const items = Array.from(this.items.values());
    
    // Simple pattern matching based on content
    const patternStr = JSON.stringify(pattern).toLowerCase();
    const matches = items.filter(item => {
      const atom = this.atoms.get(item.atom_id);
      if (!atom) return false;
      return JSON.stringify(atom.content).toLowerCase().includes(patternStr);
    });
    
    return matches.slice(0, Math.min(k || 10, matches.length));
  }

  query_by_structure(pattern: any, k?: number): CognitiveItem[] {
    // Enhanced structural query
    const items = Array.from(this.items.values());
    return items.slice(0, Math.min(k || 10, items.length));
  }

  revise_belief(new_item: CognitiveItem): CognitiveItem | null {
    // Enhanced belief revision with conflict detection
    const existing = this.items.get(new_item.id);
    if (existing && existing.type === 'BELIEF' && new_item.type === 'BELIEF') {
      // In a real implementation, this would use the belief revision engine
      this.items.set(new_item.id, new_item);
      return new_item;
    }
    this.items.set(new_item.id, new_item);
    return new_item;
  }

  register_schema_atom(atom: SemanticAtom): CognitiveSchema {
    // Create a schema that can be applied
    const schema: CognitiveSchema = {
      atom_id: atom.id,
      apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => {
        // Enhanced schema application logic
        return [];
      }
    };
    this.schemas.set(atom.id, schema);
    return schema;
  }
  
  // Enhanced query methods
  query_by_domain(domain: string, k?: number): CognitiveItem[] {
    const atomIds = this.semanticIndex.get(domain) || [];
    const items = atomIds
      .map(id => {
        // Find items that reference these atoms
        for (const [itemId, item] of this.items.entries()) {
          if (item.atom_id === id) {
            return item;
          }
        }
        return null;
      })
      .filter(item => item !== null) as CognitiveItem[];
      
    return items.slice(0, Math.min(k || 10, items.length));
  }
  
  query_by_time_range(start: number, end: number): CognitiveItem[] {
    const items: CognitiveItem[] = [];
    for (const [timeBucket, itemIds] of this.temporalIndex.entries()) {
      const bucketTime = timeBucket * 3600000;
      if (bucketTime >= start && bucketTime <= end) {
        for (const itemId of itemIds) {
          const item = this.items.get(itemId);
          if (item) items.push(item);
        }
      }
    }
    return items;
  }
  
  query_by_attention_priority(minPriority: number): CognitiveItem[] {
    const priorityKey = `priority_${Math.floor(minPriority * 10)}`;
    const itemIds = this.attentionIndex.get(priorityKey) || [];
    return itemIds
      .map(id => this.items.get(id))
      .filter(item => item !== undefined) as CognitiveItem[];
  }
  
  getStatistics(): { 
    atomCount: number; 
    itemCount: number; 
    schemaCount: number;
    domainCount: number;
  } {
    return {
      atomCount: this.atoms.size,
      itemCount: this.items.size,
      schemaCount: this.schemas.size,
      domainCount: this.semanticIndex.size
    };
  }
  
  private updateSemanticIndex(atom: SemanticAtom): void {
    if (atom.meta.domain) {
      if (!this.semanticIndex.has(atom.meta.domain)) {
        this.semanticIndex.set(atom.meta.domain, []);
      }
      this.semanticIndex.get(atom.meta.domain)!.push(atom.id);
    }
  }
  
  private updateSymbolicIndex(atom: SemanticAtom): void {
    const contentKey = JSON.stringify(atom.content).substring(0, 50); // Limit key length
    if (!this.symbolicIndex.has(contentKey)) {
      this.symbolicIndex.set(contentKey, []);
    }
    this.symbolicIndex.get(contentKey)!.push(atom.id);
  }
  
  private updateTemporalIndex(atom: SemanticAtom): void {
    const timestamp = new Date(atom.meta.timestamp).getTime();
    const timeBucket = Math.floor(timestamp / 3600000); // Group by hour
    if (!this.temporalIndex.has(timeBucket)) {
      this.temporalIndex.set(timeBucket, []);
    }
    this.temporalIndex.get(timeBucket)!.push(atom.id);
  }
  
  private updateAttentionIndex(item: CognitiveItem): void {
    // Group by priority levels (0-0.1, 0.1-0.2, etc.)
    const priorityGroup = Math.floor(item.attention.priority * 10);
    const priorityKey = `priority_${priorityGroup}`;
    if (!this.attentionIndex.has(priorityKey)) {
      this.attentionIndex.set(priorityKey, []);
    }
    this.attentionIndex.get(priorityKey)!.push(item.id);
  }
}