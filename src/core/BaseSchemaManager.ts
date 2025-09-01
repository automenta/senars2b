import { CognitiveItem, SemanticAtom } from '@/interfaces/types';
import { CognitiveSchema, WorldModel } from './worldModel';
import { SchemaMatcher } from './schemaMatcher';
import { Logger } from '@/utils/standardLogger';

/**
 * Abstract base class for schema management
 * Provides common functionality for registering, applying, and managing schemas
 */
export abstract class BaseSchemaManager implements SchemaMatcher {
  protected schemas: Map<string, CognitiveSchema> = new Map();
  protected schemaAtoms: Map<string, SemanticAtom> = new Map();
  
  /**
   * Register a schema with the system
   */
  abstract register_schema(schema: SemanticAtom, world_model: WorldModel): CognitiveSchema;
  
  /**
   * Find applicable schemas for two cognitive items
   */
  abstract find_applicable(a: CognitiveItem, b: CognitiveItem, world_model: WorldModel): CognitiveSchema[];
  
  /**
   * Apply a schema to two cognitive items
   */
  applySchema(schema: CognitiveSchema, a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel): CognitiveItem[] {
    try {
      const result = schema.apply(a, b, worldModel as any);
      Logger.info('Successfully applied schema', {
        component: 'SchemaManager',
        operation: 'applySchema',
        schemaId: schema.atom_id,
        itemA: a.id,
        itemB: b.id
      }, {
        resultCount: result.length
      });
      return result;
    } catch (error) {
      Logger.error('Error applying schema', {
        component: 'SchemaManager',
        operation: 'applySchema',
        schemaId: schema.atom_id,
        itemA: a.id,
        itemB: b.id
      }, error as Error);
      return [];
    }
  }
  
  /**
   * Get a schema by its ID
   */
  getSchema(schemaId: string): CognitiveSchema | undefined {
    return this.schemas.get(schemaId);
  }
  
  /**
   * Get all registered schemas
   */
  getAllSchemas(): CognitiveSchema[] {
    return Array.from(this.schemas.values());
  }
  
  /**
   * Remove a schema by its ID
   */
  removeSchema(schemaId: string): boolean {
    const deleted = this.schemas.delete(schemaId);
    this.schemaAtoms.delete(schemaId);
    return deleted;
  }
  
  /**
   * Get schema statistics
   */
  getSchemaStatistics(): {
    totalSchemas: number;
    schemaTypes: Record<string, number>;
  } {
    const schemaTypes: Record<string, number> = {};
    
    for (const atom of this.schemaAtoms.values()) {
      if (atom.content && typeof atom.content === 'object' && 'name' in atom.content) {
        const schemaName = (atom.content as any).name as string;
        schemaTypes[schemaName] = (schemaTypes[schemaName] || 0) + 1;
      }
    }
    
    const stats = {
      totalSchemas: this.schemas.size,
      schemaTypes
    };
    
    Logger.debug('Schema statistics retrieved', {
      component: 'SchemaManager',
      operation: 'getSchemaStatistics'
    }, stats);
    
    return stats;
  }
}