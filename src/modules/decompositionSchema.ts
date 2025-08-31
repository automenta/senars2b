import {CognitiveItem} from '../interfaces/types';
import {CognitiveSchema, WorldModel} from '../core/worldModel';
import {TaskFactory} from './taskFactory';
import logger from '../services/logger';

/**
 * A system-level schema to decompose a complex task into a series of subtasks
 * based on knowledge stored in the World Model.
 */
export const DecompositionSchema: CognitiveSchema = {
    atom_id: 'SCHEMA_SYSTEM_DECOMPOSITION',

    apply: (itemA: CognitiveItem, itemB: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
        // This schema triggers when a "Decompose" goal is paired with a task.
        const goal = (itemA.type === 'GOAL' && itemA.label.startsWith('Decompose:')) ? itemA :
            (itemB.type === 'GOAL' && itemB.label.startsWith('Decompose:')) ? itemB : null;

        const task = (itemA.type === 'TASK') ? itemA : (itemB.type === 'TASK') ? itemB : null;

        if (!goal || !task || !task.task_metadata || !task.atom_id) {
            return []; // Not applicable
        }

        const taskAtom = worldModel.get_atom(task.atom_id);
        if (!taskAtom || !taskAtom.embedding) {
            logger.warn({taskId: task.id, taskLabel: task.label}, `DecompositionSchema: Could not find atom or embedding for task.`);
            return [];
        }

        logger.info({taskId: task.id, taskLabel: task.label}, `DecompositionSchema: Attempting to decompose task`);

        // 1. Query the World Model for knowledge related to the task's embedding.
        const allRelated = worldModel.query_by_semantic(taskAtom.embedding, 3);
        const relatedKnowledge = allRelated.filter(item => item.type === 'BELIEF');

        if (relatedKnowledge.length === 0) {
            logger.info({taskId: task.id, taskLabel: task.label}, `DecompositionSchema: No relevant knowledge found.`);
            return [];
        }

        // 2. Analyze the retrieved knowledge to find a "plan".
        const planText = relatedKnowledge[0].content;
        if (typeof planText !== 'string') {
            return [];
        }

        const steps = planText.split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^(\d+\.|-|\*)\s/))
            .map(line => line.replace(/^(\d+\.|-|\*)\s/, ''));

        if (steps.length === 0) {
            logger.warn({planText}, `DecompositionSchema: Found knowledge, but could not extract steps.`);
            return [];
        }

        logger.info({stepCount: steps.length}, `DecompositionSchema: Found steps. Creating subtasks.`);

        // 3. Create a subtask for each step in the plan.
        const subtasks = steps.map((stepContent) => {
            return TaskFactory.createSubtask(
                task.id,
                stepContent,
                {...task.attention, priority: task.attention.priority * 0.9},
                task.task_metadata!.priority_level
            );
        });

        // Fix the dependency chain to use the new subtask IDs
        for (let i = 1; i < subtasks.length; i++) {
            if (subtasks[i].task_metadata) {
                subtasks[i].task_metadata!.dependencies = [subtasks[i - 1].id];
            }
        }

        return subtasks;
    }
};
