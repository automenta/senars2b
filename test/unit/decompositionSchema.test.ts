import { DecompositionSchema } from '@/modules/decompositionSchema';
import { WorldModel } from '@/core/worldModel';
import { createTaskItem, createGoalItem, createBeliefItem, createSemanticAtom } from './testUtils';

// Mock the WorldModel
const mockWorldModel: jest.Mocked<WorldModel> = {
    get_atom: jest.fn(),
    query_by_semantic: jest.fn(),
    // Add mocks for any other WorldModel methods if needed by the schema
    add_atom: jest.fn(),
    add_item: jest.fn(),
    update_item: jest.fn(),
    remove_item: jest.fn(),
    get_item: jest.fn(),
    getAllItems: jest.fn(),
    query_by_symbolic: jest.fn(),
    query_by_structure: jest.fn(),
    query_by_meta: jest.fn(),
    query_atoms_by_meta: jest.fn(),
    revise_belief: jest.fn(),
    register_schema_atom: jest.fn(),
    getStatistics: jest.fn(),
    getItemHistory: jest.fn(),
    getConfidenceDistribution: jest.fn(),
};

describe('DecompositionSchema', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should decompose a task into subtasks based on knowledge from the world model', () => {
        // 1. Setup
        const taskToDecompose = createTaskItem({
            id: 'task-1',
            label: 'Organize a conference',
            atom_id: 'atom-task-1',
        });

        const decompositionGoal = createGoalItem({
            label: `Decompose: ${taskToDecompose.label}`,
        });

        const taskAtom = createSemanticAtom({
            id: 'atom-task-1',
            content: taskToDecompose.label,
            embedding: [1, 2, 3], // Dummy embedding
        });

        const knowledgeContent = "Steps to organize a conference:\n1. Book a venue.\n2. Arrange for speakers.\n3. Sell tickets.";
        const knowledgeItem = createBeliefItem({
            content: knowledgeContent,
        });

        // Mock the world model's responses
        mockWorldModel.get_atom.mockReturnValue(taskAtom);
        mockWorldModel.query_by_semantic.mockReturnValue([knowledgeItem]);

        // 2. Execute
        const resultingSubtasks = DecompositionSchema.apply(decompositionGoal, taskToDecompose, mockWorldModel);

        // 3. Assert
        // It should have found the task's atom
        expect(mockWorldModel.get_atom).toHaveBeenCalledWith(taskToDecompose.atom_id);
        // It should have performed a semantic query using the task's embedding
        expect(mockWorldModel.query_by_semantic).toHaveBeenCalledWith(taskAtom.embedding, 3);

        // It should produce the correct number of subtasks
        expect(resultingSubtasks).toHaveLength(3);

        // Check the content of the generated subtasks
        expect(resultingSubtasks[0].label).toBe('Book a venue.');
        expect(resultingSubtasks[1].label).toBe('Arrange for speakers.');
        expect(resultingSubtasks[2].label).toBe('Sell tickets.');

        // Check that they are correctly parented
        expect(resultingSubtasks[0].task_metadata!.parent_id).toBe(taskToDecompose.id);

        // Check that they are chained in a dependency
        expect(resultingSubtasks[1].task_metadata!.dependencies).toEqual([resultingSubtasks[0].id]);
        expect(resultingSubtasks[2].task_metadata!.dependencies).toEqual([resultingSubtasks[1].id]);
    });

    it('should return an empty array if no relevant knowledge is found', () => {
        const taskToDecompose = createTaskItem({ label: 'Do something unknown' });
        const decompositionGoal = createGoalItem({ label: `Decompose: ${taskToDecompose.label}` });
        const taskAtom = createSemanticAtom({ embedding: [4, 5, 6] });

        mockWorldModel.get_atom.mockReturnValue(taskAtom);
        mockWorldModel.query_by_semantic.mockReturnValue([]); // No knowledge found

        const result = DecompositionSchema.apply(decompositionGoal, taskToDecompose, mockWorldModel);

        expect(result).toHaveLength(0);
    });

    it('should return an empty array if the task has no atom/embedding', () => {
        const taskToDecompose = createTaskItem({ label: 'A task with no atom' });
        const decompositionGoal = createGoalItem({ label: `Decompose: ${taskToDecompose.label}` });

        mockWorldModel.get_atom.mockReturnValue(null); // No atom found

        const result = DecompositionSchema.apply(decompositionGoal, taskToDecompose, mockWorldModel);

        expect(result).toHaveLength(0);
        expect(mockWorldModel.query_by_semantic).not.toHaveBeenCalled();
    });
});
