import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem, AttentionValue, TruthValue, DerivationStamp, UUID } from '../interfaces/types';

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
            truth,
            attention,
            stamp: this.createStamp(parentId ? [parentId] : [])
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
            attention,
            stamp: this.createStamp(parentId ? [parentId] : []),
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
            attention,
            stamp: this.createStamp(parentId ? [parentId] : [])
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
        type: 'BELIEF' | 'GOAL' | 'QUERY',
        parentIds: UUID[],
        schemaId: UUID,
        attention: AttentionValue,
        truth?: TruthValue,
        goalParentId?: UUID
    ): CognitiveItem {
        const item: CognitiveItem = {
            id: uuidv4(),
            atom_id: atomId,
            type,
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