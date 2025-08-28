import {CognitiveItem, SemanticAtom} from '@/interfaces/types';
import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {WorldModel} from '@/core/worldModel';
import {createAttentionValue, createTruthValue, createTaskItem} from './testUtils';
import {v4 as uuidv4} from 'uuid';
import {embeddingService} from '@/services/embeddingService';

jest.mock('@/services/embeddingService');

describe('DecentralizedCognitiveCore', () => {
    let core: DecentralizedCognitiveCore;
    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2); // 2 workers for testing
        mockEmbeddingService.generateEmbedding.mockClear();
    });

    describe('constructor', () => {
        it('should create a cognitive core with the specified number of workers', () => {
            // The core should be created successfully
            expect(core).toBeDefined();
        });
    });

    describe('addSchema', () => {
        it('should add a schema to the core', async () => {
            mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.1));
            const schemaContent = {
                name: "TestSchema",
                pattern: {
                    premise: "(?A is related to ?B)",
                    conclusion: "(?B is related to ?A)"
                }
            };

            const schemaMeta = {
                type: "CognitiveSchema",
                source: "test",
                timestamp: new Date().toISOString(),
                trust_score: 0.8
            };

            // This should not throw an error
            await expect(core.addSchema(schemaContent, schemaMeta)).resolves.not.toThrow();
        });
    });

    describe('addInitialBelief', () => {
        it('should add an initial belief to the core', async () => {
            mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.2));
            // This should not throw an error
            await expect(core.addInitialBelief(
                "Test belief content",
                createTruthValue(),
                createAttentionValue(),
                {domain: "test", source: "test_source"}
            )).resolves.not.toThrow();
        });
    });

    describe('addInitialGoal', () => {
        it('should add an initial goal to the core', async () => {
            mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.3));
            // This should not throw an error
            await expect(core.addInitialGoal(
                "Test goal content",
                createAttentionValue({priority: 0.9, durability: 0.8}),
                {domain: "test", source: "test_source"}
            )).resolves.not.toThrow();
        });
    });

    describe('getSystemStatus', () => {
        it('should return the system status', () => {
            const status = core.getSystemStatus();

            // Should return an object with expected properties
            expect(status).toHaveProperty('agendaSize');
            expect(status).toHaveProperty('worldModelStats');
            expect(status).toHaveProperty('workerStats');
            expect(typeof status.agendaSize).toBe('number');
        });
    });

    describe('isGoalAchieved logic', () => {
        it('should return true for a query goal when a corresponding belief exists', () => {
            const worldModel = (core as any).worldModel as WorldModel;
            const isGoalAchieved = (goal: CognitiveItem): boolean => (core as any).isGoalAchieved(goal);

            const goalContent = "What is the capital of France?";
            const goalAtom: SemanticAtom = {
                id: uuidv4(),
                content: goalContent,
                embedding: Array(10).fill(0).map(() => Math.random()),
                creationTime: Date.now(), // Added
                lastAccessTime: Date.now(), // Added
                meta: {type: "Fact", source: "test", timestamp: new Date().toISOString(), trust_score: 1.0}
            };
            worldModel.add_atom(goalAtom);
            const goalItem: CognitiveItem = {
                id: uuidv4(),
                atom_id: goalAtom.id,
                type: 'GOAL',
                attention: createAttentionValue(),
                label: goalContent,
                stamp: {timestamp: Date.now(), parent_ids: [], schema_id: ''}
            };

            const beliefContent = "The capital of France is Paris.";
            const beliefAtom: SemanticAtom = {
                id: uuidv4(),
                content: beliefContent,
                embedding: Array(10).fill(0).map(() => Math.random()),
                creationTime: Date.now(), // Added
                lastAccessTime: Date.now(), // Added
                meta: {type: "Fact", source: "test", timestamp: new Date().toISOString(), trust_score: 1.0}
            };
            worldModel.add_atom(beliefAtom);
            const beliefItem: CognitiveItem = {
                id: uuidv4(),
                atom_id: beliefAtom.id,
                type: 'BELIEF',
                truth: createTruthValue(),
                attention: createAttentionValue(),
                label: beliefContent,
                stamp: {timestamp: Date.now(), parent_ids: [], schema_id: ''}
            };
            worldModel.add_item(beliefItem);

            const result = isGoalAchieved(goalItem);
            expect(result).toBe(true);
        });

        it('should return false for a query goal when no corresponding belief exists', () => {
            const isGoalAchieved = (goal: CognitiveItem): boolean => (core as any).isGoalAchieved(goal);

            const goalContent = "What is the meaning of life?";
            const goalItem: CognitiveItem = {
                id: uuidv4(),
                atom_id: uuidv4(),
                type: 'GOAL',
                attention: createAttentionValue(),
                label: goalContent,
                stamp: {timestamp: Date.now(), parent_ids: [], schema_id: ''}
            };

            const result = isGoalAchieved(goalItem);
            expect(result).toBe(false);
        });
    });

    describe('isActionGoal logic', () => {
        it('should return true for a goal matching a registered action verb', () => {
            const worldModel = (core as any).worldModel as WorldModel;
            const isActionGoal = (goal: CognitiveItem): boolean => (core as any).isActionGoal(goal);

            const actionVerbAtom: SemanticAtom = {
                id: uuidv4(),
                content: 'perform analysis',
                embedding: [],
                creationTime: Date.now(), // Added
                lastAccessTime: Date.now(), // Added
                meta: {type: 'ActionVerb', source: 'system', timestamp: new Date().toISOString(), trust_score: 1.0}
            };
            worldModel.add_atom(actionVerbAtom);

            const goalItem: CognitiveItem = {
                id: uuidv4(),
                atom_id: uuidv4(),
                type: 'GOAL',
                attention: createAttentionValue(),
                label: 'perform analysis on recent data',
                stamp: {timestamp: Date.now(), parent_ids: [], schema_id: ''}
            };

            const result = isActionGoal(goalItem);
            expect(result).toBe(true);
        });

        it('should return false for a goal that does not match a registered action verb', () => {
            const isActionGoal = (goal: CognitiveItem): boolean => (core as any).isActionGoal(goal);

            const goalItem: CognitiveItem = {
                id: uuidv4(),
                atom_id: uuidv4(),
                type: 'GOAL',
                attention: createAttentionValue(),
                label: 'contemplate the meaning of the data',
                stamp: {timestamp: Date.now(), parent_ids: [], schema_id: ''}
            };

            const result = isActionGoal(goalItem);
            expect(result).toBe(false);
        });
    });

    describe('Task Processing via TaskManager', () => {
        it('should delegate task processing to the TaskManager', async () => {
            // Get the internal TaskManager instance from the core
            const taskManager = (core as any).taskManager;
            // Spy on the executeTask method
            const executeTaskSpy = jest.spyOn(taskManager, 'executeTask').mockResolvedValue(undefined);

            // Create a task item
            const task = createTaskItem({
                type: 'TASK',
                task_metadata: { status: 'in_progress', priority_level: 'high' }
            });

            // Get the internal processItem method to test the core logic
            const processItem = (item: CognitiveItem) => (core as any).processItem(item, 0);

            // Process the task
            await processItem(task);

            // Expect that the TaskManager's executeTask method was called with the task
            expect(executeTaskSpy).toHaveBeenCalledWith(task);
        });

        it('should report task statistics in getSystemStatus', () => {
            const worldModel = (core as any).worldModel;
            // Spy on and mock getAllItems to return our test tasks
            jest.spyOn(worldModel, 'getAllItems').mockReturnValue([
                createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'in_progress', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'completed', priority_level: 'medium' } })
            ]);

            const status = core.getSystemStatus();

            expect(status.taskStats).toBeDefined();
            expect(status.taskStats.pending).toBe(1);
            expect(status.taskStats.in_progress).toBe(1);
            expect(status.taskStats.completed).toBe(1);
            expect(status.taskStats.total).toBe(3);
        });
    });
});