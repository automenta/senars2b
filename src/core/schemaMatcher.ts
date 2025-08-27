import { SchemaMatcher, SemanticAtom, WorldModel, CognitiveItem, CognitiveSchema, UUID } from '../interfaces/types';

// A simple Rete-like network implementation for pattern matching
class ReteNode {
    id: string;
    condition: (item: CognitiveItem, atom: any) => boolean;
    children: ReteNode[] = [];
    schemas: Set<UUID> = new Set();

    constructor(id: string, condition: (item: CognitiveItem, atom: any) => boolean) {
        this.id = id;
        this.condition = condition;
    }

    addChild(node: ReteNode): void {
        this.children.push(node);
    }

    addSchema(schemaId: UUID): void {
        this.schemas.add(schemaId);
    }
}

export class EfficientSchemaMatcher implements SchemaMatcher {
    private schemaIndex: Map<UUID, CognitiveSchema> = new Map();
    private schemaAtoms: Map<UUID, SemanticAtom> = new Map();
    private reteNetwork: ReteNode | null = null;
    private patternIndex: Map<string, Set<UUID>> = new Map(); // pattern component -> schema_ids

    register_schema(schema: SemanticAtom, world_model: WorldModel): CognitiveSchema {
        const cognitiveSchema = world_model.register_schema_atom(schema);
        this.schemaIndex.set(schema.id, cognitiveSchema);
        this.schemaAtoms.set(schema.id, schema);
        
        // Index schema for faster lookup
        this.indexSchema(schema);
        
        // Rebuild Rete network when new schema is added
        this.buildReteNetwork();
        
        return cognitiveSchema;
    }

    find_applicable(a: CognitiveItem, b: CognitiveItem, world_model: WorldModel): CognitiveSchema[] {
        // Use Rete network to efficiently find applicable schemas
        const applicableSchemaIds = this.matchReteNetwork(a, b, world_model);
        
        // Return the actual schema objects
        return Array.from(applicableSchemaIds)
            .map(id => this.schemaIndex.get(id))
            .filter((schema): schema is CognitiveSchema => schema !== undefined);
    }
    
    private indexSchema(schema: SemanticAtom): void {
        // Index schema by pattern components for faster lookup
        if (schema.content && typeof schema.content === 'object' && 'pattern' in schema.content) {
            const pattern = schema.content.pattern;
            const patternStr = JSON.stringify(pattern).toLowerCase();
            
            // Extract keywords from pattern
            const words = patternStr.split(/\W+/).filter(w => w.length > 2);
            for (const word of words) {
                if (!this.patternIndex.has(word)) {
                    this.patternIndex.set(word, new Set());
                }
                this.patternIndex.get(word)!.add(schema.id);
            }
        }
    }
    
    private buildReteNetwork(): void {
        // Build a simple Rete-like network for pattern matching
        const root = new ReteNode('root', () => true);
        
        // Add nodes for common pattern components
        const typeNode = new ReteNode('type', (item: CognitiveItem) => 
            ['BELIEF', 'GOAL', 'QUERY'].includes(item.type));
        root.addChild(typeNode);
        
        const contentNode = new ReteNode('content', (item: CognitiveItem, atom: any) => 
            atom && (typeof atom.content === 'string' || typeof atom.content === 'object'));
        root.addChild(contentNode);
        
        // Add schema-specific nodes
        for (const [schemaId, schemaAtom] of this.schemaAtoms.entries()) {
            if (schemaAtom.content && typeof schemaAtom.content === 'object' && 'name' in schemaAtom.content) {
                const schemaNode = new ReteNode(`schema-${schemaAtom.content.name}`, () => true);
                schemaNode.addSchema(schemaId);
                root.addChild(schemaNode);
            }
        }
        
        this.reteNetwork = root;
    }
    
    private matchReteNetwork(a: CognitiveItem, b: CognitiveItem, world_model: WorldModel): Set<UUID> {
        if (!this.reteNetwork) return new Set();
        
        const applicableSchemas = new Set<UUID>();
        
        // Get atoms for both items
        const atomA = world_model.get_atom(a.atom_id);
        const atomB = world_model.get_atom(b.atom_id);
        
        if (!atomA || !atomB) return applicableSchemas;
        
        // Traverse the Rete network
        const queue: {node: ReteNode, items: CognitiveItem[], atoms: any[]}[] = [
            {node: this.reteNetwork, items: [a, b], atoms: [atomA, atomB]}
        ];
        
        while (queue.length > 0) {
            const {node, items, atoms} = queue.shift()!;
            
            // Check if node condition is satisfied
            const satisfied = items.every((item, i) => 
                node.condition(item, atoms[i]));
                
            if (satisfied) {
                // Add schemas from this node
                for (const schemaId of node.schemas) {
                    applicableSchemas.add(schemaId);
                }
                
                // Add children to queue
                for (const child of node.children) {
                    queue.push({node: child, items, atoms});
                }
            }
        }
        
        return applicableSchemas;
    }
}