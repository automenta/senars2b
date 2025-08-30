import {PriorityAgenda} from '@/core/agenda';
import {PersistentWorldModel} from '@/core/worldModel';
import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {PerceptionSubsystem} from '@/modules/perceptionSubsystem';
import {SchemaLearningModule} from '@/modules/schemaLearningModule';
import {ReflectionLoop} from '@/core/reflectionLoop';
import {createCognitiveItem, createSemanticAtom, createAttentionValue, createTruthValue, createCoreWithRealDependencies} from './testUtils';
import {CognitiveItem, SemanticAtom, AttentionValue, TruthValue} from '@/interfaces/types';

describe('Enhanced Validation and Error Handling', () => {
    describe('PriorityAgenda', () => {
        let agenda: PriorityAgenda;

        beforeEach(() => {
            agenda = new PriorityAgenda(() => null);
        });

        it('should throw error when adding null item', () => {
            expect(() => {
                agenda.push(null as any);
            }).toThrow('Item must be a valid CognitiveItem with an id and attention value.');
        });

        it('should throw error when adding item without ID', () => {
            const item = createCognitiveItem({id: undefined} as any);
            expect(() => {
                agenda.push(item);
            }).toThrow('Item must be a valid CognitiveItem with an id and attention value.');
        });

        it('should throw error when adding item without attention', () => {
            const item = createCognitiveItem({attention: undefined} as any);
            expect(() => {
                agenda.push(item);
            }).toThrow('Item must be a valid CognitiveItem with an id and attention value.');
        });

        it('should throw error when adding item with invalid priority', () => {
            const item = createCognitiveItem({
                attention: {priority: 1.5, durability: 0.5}
            });
            expect(() => {
                agenda.push(item);
            }).toThrow('Item attention priority must be a number between 0 and 1');
        });

        it('should provide enhanced statistics', () => {
            const stats = agenda.getStatistics();
            expect(stats).toHaveProperty('size');
            expect(stats).toHaveProperty('popRate');
            expect(stats).toHaveProperty('averageWaitTime');
            expect(stats).toHaveProperty('maxWaitTime');
            expect(stats).toHaveProperty('totalPops');
        });
    });

    describe('PersistentWorldModel', () => {
        let worldModel: PersistentWorldModel;

        beforeEach(() => {
            worldModel = new PersistentWorldModel();
        });

        it('should throw error when adding null atom', () => {
            expect(() => {
                worldModel.add_atom(null as any);
            }).toThrow('Cannot add null or undefined atom to world model');
        });

        it('should throw error when adding atom without ID', () => {
            const atom = createSemanticAtom({id: undefined} as any);
            expect(() => {
                worldModel.add_atom(atom);
            }).toThrow('Atom must have an ID');
        });

        it('should throw error when adding item without ID', () => {
            const item = createCognitiveItem({id: undefined} as any);
            expect(() => {
                worldModel.add_item(item);
            }).toThrow('Item must have an ID');
        });

        it('should throw error when adding item without atom_id', () => {
            const item = createCognitiveItem({atom_id: undefined} as any);
            expect(() => {
                worldModel.add_item(item);
            }).toThrow('Item must have an atom_id');
        });
    });

    describe('DecentralizedCognitiveCore', () => {
        let core: DecentralizedCognitiveCore;

        beforeEach(() => {
            core = createCoreWithRealDependencies({ workerCount: 1 }); // 1 worker for testing
        });

        it('should throw error when adding belief without content', async () => {
            await expect(core.addInitialBelief(
                undefined as any,
                createTruthValue(),
                createAttentionValue()
            )).rejects.toThrow(/content/i);
        });

        it('should throw error when adding belief without truth value', async () => {
            await expect(core.addInitialBelief(
                'Test content',
                undefined as any,
                createAttentionValue()
            )).rejects.toThrow(/truth/i);
        });

        it('should throw error when adding belief with invalid truth values', async () => {
            await expect(core.addInitialBelief(
                'Test content',
                {frequency: 1.5, confidence: 0.8} as any,
                createAttentionValue()
            )).rejects.toThrow(/truth/i);
        });

        it('should throw error when adding goal without content', async () => {
            await expect(core.addInitialGoal(
                undefined as any,
                createAttentionValue()
            )).rejects.toThrow(/content/i);
        });

        it('should throw error when adding schema without content', async () => {
            await expect(core.addSchema(undefined as any)).rejects.toThrow(/content/i);
        });
    });

    describe('PerceptionSubsystem', () => {
        let perception: PerceptionSubsystem;

        beforeEach(() => {
            perception = new PerceptionSubsystem();
        });

        it('should throw error when processing null input', async () => {
            await expect(perception.processInput(null)).rejects.toThrow('Input data is required');
        });

        it('should throw error when processing empty string', async () => {
            await expect(perception.processInput('')).rejects.toThrow('Input string cannot be empty');
        });

        it('should throw error when processing too long string', async () => {
            const longString = 'a'.repeat(10001);
            await expect(perception.processInput(longString)).rejects.toThrow('Input string is too long (maximum 10,000 characters)');
        });
    });

    describe('SchemaLearningModule', () => {
        let worldModel: PersistentWorldModel;
        let schemaLearning: SchemaLearningModule;

        beforeEach(() => {
            worldModel = new PersistentWorldModel();
            schemaLearning = new SchemaLearningModule(worldModel);
        });

        it('should throw error when recording usage with invalid schema ID', () => {
            expect(() => {
                schemaLearning.recordSchemaUsage('', true, []);
            }).toThrow('Schema ID is required');
        });

        it('should throw error when recording usage with invalid items', () => {
            expect(() => {
                schemaLearning.recordSchemaUsage('test-schema', true, null as any);
            }).toThrow('Items must be an array');
        });
    });

    describe('ReflectionLoop', () => {
        let worldModel: PersistentWorldModel;
        let agenda: PriorityAgenda;
        let reflectionLoop: ReflectionLoop;

        beforeEach(() => {
            worldModel = new PersistentWorldModel();
            agenda = new PriorityAgenda(() => null);
            reflectionLoop = new ReflectionLoop(worldModel, agenda);
        });

        it('should provide performance metrics', () => {
            const metrics = reflectionLoop.getPerformanceMetrics();
            expect(metrics).toHaveProperty('cyclesRun');
            expect(metrics).toHaveProperty('errorsEncountered');
            expect(metrics).toHaveProperty('lastError');
            expect(metrics).toHaveProperty('averageCycleTime');
        });
    });
});