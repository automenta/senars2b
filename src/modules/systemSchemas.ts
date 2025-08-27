import { CognitiveSchema, CognitiveItem, WorldModel, TruthValue } from '../interfaces/types';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

/**
 * A system-level schema to record the history of belief changes.
 * This schema listens for 'BeliefUpdated' events and creates a new
 * historical belief item in the world model.
 */
export const HistoryRecordingSchema: CognitiveSchema = {
    atom_id: 'SCHEMA_SYSTEM_HISTORY_RECORDER', // A unique, hardcoded ID for this system schema

    apply: (itemA: CognitiveItem, itemB: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
        // This schema is unary, it only operates on a single event item.
        // We check both itemA and itemB to see if one is the event.
        const eventItem = itemA.type === 'EVENT' && itemA.label === 'BeliefUpdated' ? itemA :
                          itemB.type === 'EVENT' && itemB.label === 'BeliefUpdated' ? itemB :
                          null;

        if (!eventItem || !eventItem.payload) {
            return []; // Not applicable
        }

        const { itemId, oldTruth, newTruth } = eventItem.payload;

        if (!itemId || !oldTruth || !newTruth) {
            console.warn('HistoryRecordingSchema: Invalid payload for BeliefUpdated event.', eventItem.payload);
            return [];
        }

        // Create a new semantic atom for the historical record.
        // The content itself is structured metadata.
        const historyAtomContent = {
            historicalRecordFor: itemId,
            recordedTruth: oldTruth,
            timestamp: eventItem.stamp.timestamp,
        };

        const historyAtom = {
            id: uuidv4(),
            content: historyAtomContent,
            embedding: [], // Historical records may not need semantic embeddings
            meta: {
                type: 'Observation' as const,
                source: 'system_history_module',
                timestamp: new Date().toISOString(),
                trust_score: 1.0, // System events are fully trusted
                domain: 'system_internals'
            }
        };

        worldModel.add_atom(historyAtom);

        // Create a new belief item representing the historical fact.
        const historicalBelief = CognitiveItemFactory.createBelief(
            historyAtom.id,
            oldTruth as TruthValue,
            { priority: 0.1, durability: 0.9 } // Historical facts are not urgent but should persist
        );

        historicalBelief.label = `History: Truth of ${itemId} at ${eventItem.stamp.timestamp}`;
        historicalBelief.meta = {
            historicalRecordFor: itemId,
            timestamp: eventItem.stamp.timestamp,
            isHistory: true,
        };

        return [historicalBelief];
    }
};
