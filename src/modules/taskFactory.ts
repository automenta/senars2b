import { CognitiveItem, AttentionValue, TruthValue, TaskMetadata } from '../interfaces/types';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

export class TaskFactory {
    static createTask(
        content: string,
        attention: AttentionValue,
        taskMetadata?: TaskMetadata
    ): CognitiveItem {
        // Create a semantic atom for the task
        const atomId = uuidv4();
        const atom = {
            id: atomId,
            content: content,
            embedding: [], // Will be populated by the system
            creationTime: Date.now(),
            lastAccessTime: Date.now(),
            meta: {
                type: "Task",
                source: "task_factory"
            }
        };

        // Create a cognitive item (GOAL type for tasks)
        const cognitiveItem = CognitiveItemFactory.createGoal(atomId, attention);
        cognitiveItem.label = content;
        cognitiveItem.goal_status = "active";
        
        // Add task metadata if provided
        if (taskMetadata) {
            cognitiveItem.task_metadata = taskMetadata;
        }

        return cognitiveItem;
    }
    
    static createDerivedTask(
        parentIds: string[],
        content: string,
        attention: AttentionValue,
        taskMetadata?: TaskMetadata
    ): CognitiveItem {
        // Create a semantic atom for the derived task
        const atomId = uuidv4();
        const atom = {
            id: atomId,
            content: content,
            embedding: [], // Will be populated by the system
            creationTime: Date.now(),
            lastAccessTime: Date.now(),
            meta: {
                type: "DerivedTask",
                source: "task_factory",
                parentIds: parentIds
            }
        };

        // Create a derived cognitive item (GOAL type for tasks)
        const cognitiveItem = CognitiveItemFactory.createDerivedItem(
            atomId,
            'GOAL',
            parentIds,
            'task-factory',
            attention,
            undefined, // truth value not needed for goals
            undefined, // goal parent ID
            content
        );
        
        cognitiveItem.goal_status = "active";
        
        // Add task metadata if provided
        if (taskMetadata) {
            cognitiveItem.task_metadata = taskMetadata;
        }

        return cognitiveItem;
    }
}