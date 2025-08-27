import {PersistentWorldModel} from '@/core/worldModel';
import {SimpleBeliefRevisionEngine} from '@/core/beliefRevisionEngine';
import {HistoryRecordingSchema} from '@/modules/systemSchemas';
import {EfficientSchemaMatcher} from '@/core/schemaMatcher';
import {SemanticAtom} from '@/interfaces/types';
import {createBeliefItem, createSemanticAtom} from './testUtils';

describe('PersistentWorldModel', () => {
    let worldModel: PersistentWorldModel;
    let revisionEngine: SimpleBeliefRevisionEngine;
    let schemaMatcher: EfficientSchemaMatcher;

    beforeEach(() => {
        worldModel = new PersistentWorldModel();
        revisionEngine = new SimpleBeliefRevisionEngine();
        schemaMatcher = new EfficientSchemaMatcher();

        // Register the history schema for testing
        const historySchemaAtom: SemanticAtom = {
            id: HistoryRecordingSchema.atom_id,
            content: {name: 'HistoryRecordingSchema', apply: HistoryRecordingSchema.apply},
            embedding: [],
            creationTime: Date.now(), // Added
            lastAccessTime: Date.now(), // Added
            meta: {
                type: "CognitiveSchema",
                source: "system",
                timestamp: new Date().toISOString(),
                trust_score: 1.0,
                domain: "system_internals"
            }
        };
        worldModel.add_atom(historySchemaAtom);
        schemaMatcher.register_schema(historySchemaAtom, worldModel);
    });

    describe('add_atom and get_atom', () => {
        it('should add and retrieve a semantic atom', () => {
            const atom = createSemanticAtom();

            const atomId = worldModel.add_atom(atom);
            expect(atomId).toBe(atom.id);

            const retrievedAtom = worldModel.get_atom(atomId);
            expect(retrievedAtom).toEqual(atom);
        });

        it('should return null for a non-existent atom', () => {
            const retrievedAtom = worldModel.get_atom(createSemanticAtom().id);
            expect(retrievedAtom).toBeNull();
        });
    });

    describe('add_item and get_item', () => {
        it('should add and retrieve a cognitive item', () => {
            const item = createBeliefItem();

            worldModel.add_item(item);

            const retrievedItem = worldModel.get_item(item.id);
            expect(retrievedItem).toEqual(item);
        });

        it('should return null for a non-existent item', () => {
            const retrievedItem = worldModel.get_item(createBeliefItem().id);
            expect(retrievedItem).toBeNull();
        });
    });

    describe('query_by_semantic', () => {
        it('should return semantic query results', () => {
            const embedding = Array(768).fill(0.5);
            const results = worldModel.query_by_semantic(embedding, 5);

            // Should return an array (could be empty depending on implementation)
            expect(Array.isArray(results)).toBe(true);
        });
    });

    describe('query_by_symbolic', () => {
        it('should return symbolic query results', () => {
            const pattern = {test: "pattern"};
            const results = worldModel.query_by_symbolic(pattern, 5);

            // Should return an array (could be empty depending on implementation)
            expect(Array.isArray(results)).toBe(true);
        });
    });

    describe('revise_belief', () => {
        it('should add a new belief and not generate an event', () => {
            const item = createBeliefItem();

            const [revisedItem, event] = worldModel.revise_belief(item);

            expect(revisedItem).toEqual(item);
            expect(event).toBeNull();
            expect(worldModel.get_item(item.id)).toEqual(item);
        });

        it('should revise an existing belief and generate a BeliefUpdated event', () => {
            const originalItem = createBeliefItem({id: 'belief-1'});
            worldModel.add_item(originalItem);

            const newItem = createBeliefItem({
                id: 'belief-1',
                truth: {frequency: 0.5, confidence: 0.7}
            });

            const [revisedItem, event] = worldModel.revise_belief(newItem);

            expect(revisedItem).toBeDefined();
            expect(revisedItem!.id).toBe('belief-1');
            expect(revisedItem!.truth!.frequency).not.toBe(0.8); // Should have been merged

            expect(event).toBeDefined();
            expect(event!.type).toBe('EVENT');
            expect(event!.label).toBe('BeliefUpdated');
            expect(event!.payload!.itemId).toBe('belief-1');
            expect(event!.payload!.oldTruth.frequency).toBe(0.8);
            expect(event!.payload!.newTruth.confidence).toBe(revisedItem!.truth!.confidence);
        });
    });

    describe('History Tracking', () => {
        it('should create a historical belief item after a belief is revised', () => {
            const originalItem = createBeliefItem({id: 'belief-2'});
            worldModel.add_item(originalItem);

            const newItem = createBeliefItem({
                id: 'belief-2',
                truth: {frequency: 0.1, confidence: 0.6}
            });

            const [, event] = worldModel.revise_belief(newItem);

            expect(event).toBeDefined();

            // Simulate the cognitive core processing the event
            const historicalBeliefs = HistoryRecordingSchema.apply(event!, {} as any, worldModel);
            expect(historicalBeliefs).toHaveLength(1);

            const historicalBelief = historicalBeliefs[0];
            worldModel.add_item(historicalBelief);

            expect(historicalBelief.type).toBe('BELIEF');
            expect(historicalBelief.meta!.historicalRecordFor).toBe('belief-2');
            expect(historicalBelief.truth).toEqual(originalItem.truth);

            // Now, test the API layer for retrieving history
            const history = worldModel.getItemHistory('belief-2');
            expect(history).toHaveLength(1);
            expect(history[0].id).toBe(historicalBelief.id);
        });

        it('should retrieve multiple historical records for an item', async () => {
            const itemId = 'belief-3';
            const item1 = createBeliefItem({id: itemId, truth: {frequency: 0.1, confidence: 0.2}});
            worldModel.add_item(item1);

            // First revision
            const item2 = createBeliefItem({id: itemId, truth: {frequency: 0.3, confidence: 0.4}});
            const [, event1] = worldModel.revise_belief(item2);
            const [hist1] = HistoryRecordingSchema.apply(event1!, {} as any, worldModel);
            worldModel.add_item(hist1);

            // Introduce a small delay to ensure a different timestamp
            await new Promise(resolve => setTimeout(resolve, 5));

            // Second revision
            const item3 = createBeliefItem({id: itemId, truth: {frequency: 0.5, confidence: 0.6}});
            const [, event2] = worldModel.revise_belief(item3);
            const [hist2] = HistoryRecordingSchema.apply(event2!, {} as any, worldModel);
            worldModel.add_item(hist2);

            const history = worldModel.getItemHistory(itemId);
            expect(history).toHaveLength(2);
            // Check if sorted correctly (most recent first)
            expect(history[0].stamp.timestamp).toBeGreaterThan(history[1].stamp.timestamp);
        });
    });
});