import { WorldModel } from './worldModel';
import { SchemaMatcher } from './schemaMatcher';
import { SemanticAtom } from '../interfaces/types';
import {
  HistoryAnalysisSchema,
  HistoryRecordingSchema,
} from '../modules/systemSchemas';
import { DecompositionSchema } from '../modules/decompositionSchema';
import {
  META_SOURCE_SYSTEM,
  META_TYPE_COGNITIVE_SCHEMA,
  SYSTEM_INTERNALS_DOMAIN,
} from '../utils/constants';

export class SystemSchemaRegistry {
  private worldModel: WorldModel;
  private schemaMatcher: SchemaMatcher;

  constructor(worldModel: WorldModel, schemaMatcher: SchemaMatcher) {
    this.worldModel = worldModel;
    this.schemaMatcher = schemaMatcher;
  }

  public register(): void {
    this.registerSystemSchema(
      HistoryRecordingSchema,
      'HistoryRecordingSchema'
    );
    this.registerSystemSchema(HistoryAnalysisSchema, 'HistoryAnalysisSchema');
    this.registerSystemSchema(DecompositionSchema, 'DecompositionSchema');
  }

  private registerSystemSchema(
    schemaDef: { atom_id: string; apply: Function },
    name: string
  ): void {
    const schemaAtom: SemanticAtom = {
      id: schemaDef.atom_id,
      content: { type: 'schema', name, apply: schemaDef.apply },
      embedding: [], // System schema, no embedding needed
      creationTime: Date.now(),
      lastAccessTime: Date.now(),
      meta: {
        type: META_TYPE_COGNITIVE_SCHEMA,
        source: META_SOURCE_SYSTEM,
        timestamp: new Date().toISOString(),
        trust_score: 1.0,
        domain: SYSTEM_INTERNALS_DOMAIN,
      },
    };
    this.worldModel.add_atom(schemaAtom);
    this.schemaMatcher.register_schema(schemaAtom, this.worldModel);
  }
}
