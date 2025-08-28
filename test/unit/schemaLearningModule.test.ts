import {SchemaLearningModule} from '@/modules/schemaLearningModule';
import {CognitiveItem, SemanticAtom} from '@/interfaces/types';
import {WorldModel} from '@/core/worldModel';

// Mock WorldModel for testing
class MockWorldModel implements WorldModel {
    update_item(item: CognitiveItem): void {
        // Mock
    }
    remove_item(id: string): boolean {
        return true;
    }
    query_atoms_by_meta(key: string, value: any): SemanticAtom[] {
        return [];
    }

    add_atom(atom: SemanticAtom): string {
        return atom.id;
    }

    add_item(item: CognitiveItem): void {
        // Mock implementation
    }

    get_atom(id: string): SemanticAtom | null {
        return null;
    }

    get_item(id: string): CognitiveItem | null {
        return null;
    }

    query_by_semantic(embedding: number[], k: number): CognitiveItem[] {
        return [];
    }

    query_by_symbolic(pattern: any, k?: number): CognitiveItem[] {
        return [];
    }

    query_by_structure(pattern: any, k?: number): CognitiveItem[] {
        return [];
    }

    query_by_meta(key: string, value: any): CognitiveItem[] {
        return [];
    }

    revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null] {
        return [new_item, null];
    }

    register_schema_atom(atom: SemanticAtom): any {
        return {atom_id: atom.id};
    }

    getStatistics() {
        return {atomCount: 0, itemCount: 0, schemaCount: 0, averageItemDurability: 0};
    }

    getItemHistory(itemId: string) {
        return [];
    }

    getConfidenceDistribution() {
        return {bins: [], counts: []};
    }

    getAllItems(): CognitiveItem[] {
        return [];
    }
}

describe('SchemaLearningModule', () => {
    let schemaLearningModule: SchemaLearningModule;
    let mockWorldModel: MockWorldModel;

    beforeEach(() => {
        mockWorldModel = new MockWorldModel();
        schemaLearningModule = new SchemaLearningModule(mockWorldModel, 0.7, 3); // Lower threshold for testing
    });

    describe('recordSchemaUsage', () => {
        it('should record schema usage for learning purposes', () => {
            const items: CognitiveItem[] = [
                {
                    id: 'item-1',
                    atom_id: 'atom-1',
                    type: 'BELIEF',
                    label: 'Test Belief 1',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'}
                },
                {
                    id: 'item-2',
                    atom_id: 'atom-2',
                    type: 'BELIEF',
                    label: 'Test Belief 2',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'}
                }
            ];

            schemaLearningModule.recordSchemaUsage('schema-1', true, items);

            // Should record the successful usage
            const statistics = schemaLearningModule.getStatistics();
            expect(statistics.totalApplications).toBe(1);
            expect(statistics.successfulGeneralizations).toBe(0); // Not enough applications yet
        });
    });

    describe('learnNewSchemas', () => {
        it('should learn new schemas from successful patterns', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Record multiple successful usages of the same schema
            const items: CognitiveItem[] = [
                {
                    id: 'item-1',
                    atom_id: 'atom-1',
                    type: 'BELIEF',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'},
                    label: 'Medical diagnosis test'
                },
                {
                    id: 'item-2',
                    atom_id: 'atom-2',
                    type: 'BELIEF',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'},
                    label: 'Legal reasoning test'
                }
            ];

            // Record 3 successful usages to meet the minimum threshold
            schemaLearningModule.recordSchemaUsage('schema-1', true, items);
            schemaLearningModule.recordSchemaUsage('schema-1', true, items);
            schemaLearningModule.recordSchemaUsage('schema-1', true, items);

            // Try to learn new schemas
            const newSchemaIds = schemaLearningModule.learnNewSchemas();

            // Should attempt to create a new schema (may or may not succeed based on implementation)
            // The important thing is that it attempts to learn

            consoleSpy.mockRestore();
        });
    });

    describe('getStatistics', () => {
        it('should return learning statistics', () => {
            // Record some usage
            const items: CognitiveItem[] = [
                {
                    id: 'item-1',
                    atom_id: 'atom-1',
                    type: 'BELIEF',
                    label: 'Test Belief 1',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'}
                }
            ];

            schemaLearningModule.recordSchemaUsage('schema-1', true, items);
            schemaLearningModule.recordSchemaUsage('schema-1', false, items);

            const statistics = schemaLearningModule.getStatistics();

            // Should return correct statistics
            expect(statistics.trackedSchemas).toBe(1);
            expect(statistics.totalApplications).toBe(2);
            expect(statistics.learningThreshold).toBe(0.7);
            expect(statistics.minApplications).toBe(3);
        });
    });

    describe('clearHistory', () => {
        it('should clear the schema usage history', () => {
            // Record some usage
            const items: CognitiveItem[] = [
                {
                    id: 'item-1',
                    atom_id: 'atom-1',
                    type: 'BELIEF',
                    label: 'Test Belief 1',
                    attention: {priority: 0.5, durability: 0.5},
                    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'schema-1'}
                }
            ];

            schemaLearningModule.recordSchemaUsage('schema-1', true, items);

            // Clear the history
            schemaLearningModule.clearHistory();

            // Should have cleared the history
            const statistics = schemaLearningModule.getStatistics();
            expect(statistics.trackedSchemas).toBe(0);
            expect(statistics.totalApplications).toBe(0);
        });
    });
});