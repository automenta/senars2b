import { CognitiveItem, SemanticAtom } from '@/interfaces/types';
import { UnifiedBaseComponent, BaseConfig } from './UnifiedBaseComponent';
import { Logger } from '@/utils/standardLogger';

interface SchemaManagerConfig extends BaseConfig {
  enableSchemaValidation?: boolean;
  maxSchemaCount?: number;
  schemaUsageTracking?: boolean;
}

interface SchemaManagerEvents {
  schemaRegistered: { schemaId: string };
  schemaApplied: { schemaId: string; itemA: string; itemB: string; resultCount: number };
  schemaError: { schemaId: string; itemA: string; itemB: string; error: Error };
  schemaValidationFailed?: { schemaId: string; reason: string };
}

export type CognitiveSchema = {
  atom_id: string;
  apply: (a: CognitiveItem, b: CognitiveItem, worldModel: any) => CognitiveItem[];
};

/**
 * Abstract base class for schema management with unified base component functionality
 */
export abstract class UnifiedSchemaManager extends UnifiedBaseComponent<SchemaManagerConfig, SchemaManagerEvents> {
  protected schemas: Map<string, CognitiveSchema> = new Map();
  protected schemaAtoms: Map<string, SemanticAtom> = new Map();
  
  constructor(defaultConfig: SchemaManagerConfig, userConfig: Partial<SchemaManagerConfig> = {}) {
    super('SchemaManager', defaultConfig, userConfig);
  }
  
  /**
   * Register a schema with the system
   */
  abstract register_schema(schema: SemanticAtom, world_model: any): CognitiveSchema;
  
  /**
   * Find applicable schemas for two cognitive items
   */
  abstract find_applicable(a: CognitiveItem, b: CognitiveItem, world_model: any): CognitiveSchema[];
  
  /**
   * Apply a schema to two cognitive items
   */
  applySchema(schema: CognitiveSchema, a: CognitiveItem, b: CognitiveItem, worldModel: any): CognitiveItem[] {
    try {
      const result = schema.apply(a, b, worldModel);
      this.notifyEvent('schemaApplied', { 
        schemaId: schema.atom_id, 
        itemA: a.id, 
        itemB: b.id, 
        resultCount: result.length 
      }, {
        component: 'SchemaManager',
        operation: 'applySchema'
      });
      return result;
    } catch (error) {
      this.notifyEvent('schemaError', { 
        schemaId: schema.atom_id, 
        itemA: a.id, 
        itemB: b.id, 
        error: error as Error
      }, {
        component: 'SchemaManager',
        operation: 'applySchema'
      });
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