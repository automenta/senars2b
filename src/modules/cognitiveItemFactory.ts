import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem, AttentionValue, TruthValue, DerivationStamp, UUID } from '../interfaces/types';

export class CognitiveItemFactory {
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

    static createQuery(atomId: string, attention: AttentionValue, parentId?: string): CognitiveItem {
        return {
            id: uuidv4(),
            atom_id: atomId,
            type: 'QUERY',
            attention,
            stamp: this.createStamp(parentId ? [parentId] : [])
        };
    }

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

    private static createStamp(parentIds: string[], schemaId?: string): DerivationStamp {
        return {
            timestamp: Date.now(),
            parent_ids: parentIds,
            schema_id: schemaId || uuidv4()
        };
    }
}