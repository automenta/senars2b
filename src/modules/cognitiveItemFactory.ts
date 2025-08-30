import {AttentionValue, CognitiveItem, DerivationStamp, TaskMetadata, TruthValue} from '../interfaces/types';
import {v4 as uuidv4} from 'uuid';

/**
 * CognitiveItemFactory - Factory for creating cognitive items with consistent structure
 *
 * This factory ensures that all cognitive items are created with proper UUIDs,
 * timestamps, and consistent structure according to the cognitive architecture.
 */
export class CognitiveItemFactory {
    /**
     * Create a belief cognitive item
     * @param atomId The ID of the semantic atom this belief is based on
     * @param truth The truth value of the belief
     * @param attention The attention value of the belief
     * @param parentId Optional parent ID for derived beliefs
     * @returns A new belief cognitive item
     */
    static createBelief(atomId: string, truth: TruthValue, attention: AttentionValue, parentId?: string): CognitiveItem {
        return {
            id: uuidv4(),
            atom_id: atomId,
            type: 'BELIEF',
            label: 'New Belief', // Default label
            truth,
            attention,
            stamp: {
                timestamp: Date.now(),
                parent_ids: [],
                schema_id: 'cognitive-item-factory'
            }
        };
    }

    /**
     * Create an event cognitive item
     * @param label A label for the event, e.g., 'BeliefUpdated'
     * @param payload The data associated with the event
     * @param attention The attention value for the event
     * @returns A new event cognitive item
     */
    static createEvent(label: string, payload: Record<string, any>, attention: AttentionValue): CognitiveItem {
        // Events might not have a semantic atom, so we use a placeholder UUID for atom_id
        const atomId = uuidv4();
        return {
            id: uuidv4(),
            atom_id: atomId,
            type: 'EVENT',
            label: label,
            payload: payload,
            attention: attention,
            stamp: this.createStamp([])
        };
    }

    /**
     * Create a goal cognitive item
     * @param atomId The ID of the semantic atom this goal is based on
     * @param attention The attention value of the goal
     * @param parentId Optional parent ID for derived goals
     * @returns A new goal cognitive item
     */
    static createGoal(atomId: string, attention: AttentionValue, parentId?: string): CognitiveItem {
        return {
            id: uuidv4(),
            atom_id: atomId,
            type: 'GOAL',
            label: 'New Goal', // Default label
            attention,
            stamp: {
                timestamp: Date.now(),
                parent_ids: parentId ? [parentId] : [],
                schema_id: 'cognitive-item-factory'
            },
            goal_status: 'active'
        };
    }

    /**
     * Create a query cognitive item
     * @param atomId The ID of the semantic atom this query is based on
     * @param attention The attention value of the query
     * @param parentId Optional parent ID for derived queries
     * @returns A new query cognitive item
     */
    static createQuery(atomId: string, attention: AttentionValue, parentId?: string): CognitiveItem {
        return {
            id: uuidv4(),
            atom_id: atomId,
            type: 'QUERY',
            label: 'New Query', // Default label
            attention,
            stamp: this.createStamp(parentId ? [parentId] : [])
        };
    }

    /**
     * Create a task cognitive item
     * @param content The content of the task
     * @param attention The attention value of the task
     * @param taskMetadata Optional task metadata
     * @returns A new task cognitive item
     */
    static createTask(content: string, attention: AttentionValue, taskMetadata?: Partial<TaskMetadata>, atomId?: string): CognitiveItem {
        const defaultTaskMetadata: TaskMetadata = {
            status: 'pending',
            priority_level: 'medium',
            subtasks: []
        };

        return {
            id: uuidv4(),
            atom_id: atomId || uuidv4(), // Use provided atomId or create a new one
            type: 'TASK',
            label: content,
            content: content,
            attention,
            task_metadata: {...defaultTaskMetadata, ...taskMetadata},
            created_at: Date.now(),
            updated_at: Date.now(),
            stamp: {
                timestamp: Date.now(),
                parent_ids: [],
                schema_id: 'cognitive-item-factory'
            }
        };
    }

    /**
     * Create a derived cognitive item
     * @param atomId The ID of the semantic atom this item is based on
     * @param type The type of cognitive item to create
     * @param parentIds The IDs of the parent items
     * @param schemaId The ID of the schema used to derive this item
     * @param attention The attention value of the derived item
     * @param truth Optional truth value (required for beliefs)
     * @param goalParentId Optional parent goal ID (for subgoals)
     * @returns A new derived cognitive item
     */
    static createDerivedItem(
        atomId: string,
        type: 'BELIEF' | 'GOAL' | 'QUERY' | 'TASK',
        parentIds: string[],
        schemaId: string,
        attention: AttentionValue,
        truth?: TruthValue,
        goalParentId?: string,
        label: string = 'Derived Item' // Default label
    ): CognitiveItem {
        const item: CognitiveItem = {
            id: uuidv4(),
            atom_id: atomId,
            type,
            label,
            attention,
            stamp: this.createStamp(parentIds, schemaId)
        };

        if (truth && type === 'BELIEF') {
            item.truth = truth;
        }

        if (type === 'GOAL') {
            item.goal_status = 'active';
            if (goalParentId) {
                item.goal_parent_id = goalParentId;
            }
        }

        if (type === 'TASK') {
            item.content = label;
            item.task_metadata = {
                status: 'pending',
                priority_level: 'medium',
                subtasks: []
            };
            item.created_at = Date.now();
            item.updated_at = Date.now();
        }

        return item;
    }

    /**
     * Create a derivation stamp for tracking item lineage
     * @param parentIds The IDs of the parent items
     * @param schemaId Optional schema ID that was used to derive this item
     * @returns A new derivation stamp
     */
    private static createStamp(parentIds: string[], schemaId?: string): DerivationStamp {
        return {
            timestamp: Date.now(),
            parent_ids: parentIds,
            schema_id: schemaId || uuidv4()
        };
    }
}