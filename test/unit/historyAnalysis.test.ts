import {PersistentWorldModel} from '@/core/worldModel';
import {HistoryAnalysisSchema} from '@/modules/systemSchemas';
import {CognitiveItemFactory} from '@/modules/cognitiveItemFactory';
import {CognitiveItem, TruthValue, WorldModel} from '@/interfaces/types';
import {v4 as uuidv4} from 'uuid';

describe('HistoryAnalysisSchema', () => {
    let worldModel: WorldModel;
    let baseBelief: CognitiveItem;

    // Helper to manually create a historical item
    const createHistoryItem = (beliefId: string, truth: TruthValue, timestamp: number): CognitiveItem => {
        const historyAtom = {
            id: uuidv4(),
            content: {historicalRecordFor: beliefId, recordedTruth: truth, timestamp},
            embedding: [],
            meta: {
                type: 'Observation' as const,
                source: 'system_history_module',
                timestamp: new Date(timestamp).toISOString(),
                trust_score: 1.0
            }
        };
        (worldModel as PersistentWorldModel).add_atom(historyAtom);

        const historicalBelief = CognitiveItemFactory.createBelief(historyAtom.id, truth, {
            priority: 0.1,
            durability: 0.9
        });
        historicalBelief.label = `History: Truth of ${beliefId} at ${timestamp}`;
        historicalBelief.meta = {historicalRecordFor: beliefId, timestamp, isHistory: true};
        historicalBelief.stamp.timestamp = timestamp;
        return historicalBelief;
    };

    beforeEach(() => {
        worldModel = new PersistentWorldModel();
        const atom = {
            id: uuidv4(),
            content: "The sky is blue",
            embedding: [],
            meta: {type: 'Fact' as const, source: 'test', timestamp: new Date().toISOString(), trust_score: 1.0}
        };
        worldModel.add_atom(atom);

        baseBelief = CognitiveItemFactory.createBelief(
            atom.id,
            {frequency: 1.0, confidence: 0.5},
            {priority: 0.5, durability: 0.5}
        );
        worldModel.add_item(baseBelief);
    });

    it('should not generate an insight if history is too short', () => {
        const historyItem = createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, Date.now() - 10000);
        worldModel.add_item(historyItem);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(insights).toHaveLength(0);
    });

    it('should generate a stability insight for a belief that has not changed in a long time', () => {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const stableTruth = {frequency: 1.0, confidence: 0.7};

        // Manually create history with identical truth values, with the last one being old
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 2 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.5 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.2 * ONE_HOUR));

        baseBelief.truth = stableTruth; // Set current belief to match
        worldModel.add_item(baseBelief);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('stability');
    });

    it('should generate a trend_increasing insight for a belief with consistently increasing confidence', () => {
        const now = Date.now();
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.5}, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.7}, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('trend_increasing');
    });

    it('should generate an oscillation insight for a belief with contested frequency', () => {
        const now = Date.now();
        const constantConfidence = 0.9;
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.8,
            confidence: constantConfidence
        }, now - 40000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.2,
            confidence: constantConfidence
        }, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.9,
            confidence: constantConfidence
        }, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.1,
            confidence: constantConfidence
        }, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('oscillation');
    });

    import {CognitiveItem, TruthValue} from '@/interfaces/types';
import {PersistentWorldModel, WorldModel} from '@/core/worldModel';
import {HistoryAnalysisSchema, HistoryRecordingSchema} from '@/modules/systemSchemas';
import {CognitiveItemFactory} from '@/modules/cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';

describe('HistoryAnalysisSchema', () => {
    let worldModel: WorldModel;
    let baseBelief: CognitiveItem;

    // Helper to manually create a historical item
    const createHistoryItem = (beliefId: string, truth: TruthValue, timestamp: number): CognitiveItem => {
        const historyAtom = {
            id: uuidv4(),
            content: {historicalRecordFor: beliefId, recordedTruth: truth, timestamp},
            embedding: [],
            creationTime: timestamp, // Added
            lastAccessTime: timestamp, // Added
            meta: {
                type: 'Observation' as const,
                source: 'system_history_module',
                timestamp: new Date(timestamp).toISOString(),
                trust_score: 1.0
            }
        };
        (worldModel as PersistentWorldModel).add_atom(historyAtom as any);

        const historicalBelief = CognitiveItemFactory.createBelief(historyAtom.id, truth, {
            priority: 0.1,
            durability: 0.9
        });
        historicalBelief.label = `History: Truth of ${beliefId} at ${timestamp}`;
        historicalBelief.meta = {historicalRecordFor: beliefId, timestamp, isHistory: true};
        historicalBelief.stamp.timestamp = timestamp;
        return historicalBelief;
    };

    beforeEach(() => {
        worldModel = new PersistentWorldModel();
        const atom = {
            id: uuidv4(),
            content: "The sky is blue",
            embedding: [],
            creationTime: Date.now(), // Added
            lastAccessTime: Date.now(), // Added
            meta: {type: 'Fact' as const, source: 'test', timestamp: new Date().toISOString(), trust_score: 1.0}
        };
        worldModel.add_atom(atom as any);

        baseBelief = CognitiveItemFactory.createBelief(
            atom.id,
            {frequency: 1.0, confidence: 0.5},
            {priority: 0.5, durability: 0.5}
        );
        worldModel.add_item(baseBelief);
    });

    it('should not generate an insight if history is too short', () => {
        const historyItem = createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, Date.now() - 10000);
        worldModel.add_item(historyItem);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(insights).toHaveLength(0);
    });

    it('should generate a stability insight for a belief that has not changed in a long time', () => {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const stableTruth = {frequency: 1.0, confidence: 0.7};

        // Manually create history with identical truth values, with the last one being old
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 2 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.5 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.2 * ONE_HOUR));

        baseBelief.truth = stableTruth; // Set current belief to match
        worldModel.add_item(baseBelief);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('stability');
    });

    it('should generate a trend_increasing insight for a belief with consistently increasing confidence', () => {
        const now = Date.now();
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.5}, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.7}, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('trend_increasing');
    });

    it('should generate an oscillation insight for a belief with contested frequency', () => {
        const now = Date.now();
        const constantConfidence = 0.9;
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.8,
            confidence: constantConfidence
        }, now - 40000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.2,
            confidence: constantConfidence
        }, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.9,
            confidence: constantConfidence
        }, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.1,
            confidence: constantConfidence
        }, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('oscillation');
    });

    import {PersistentWorldModel, WorldModel} from '@/core/worldModel';
import {HistoryAnalysisSchema, HistoryRecordingSchema} from '@/modules/systemSchemas';
import {CognitiveItemFactory} from '@/modules/cognitiveItemFactory';
import {CognitiveItem, TruthValue, SemanticAtom} from '@/interfaces/types';
import {v4 as uuidv4} from 'uuid';

describe('HistoryAnalysisSchema', () => {
    let worldModel: WorldModel;
    let baseBelief: CognitiveItem;

    // Helper to manually create a historical item
    const createHistoryItem = (beliefId: string, truth: TruthValue, timestamp: number): CognitiveItem => {
        const historyAtom: SemanticAtom = {
            id: uuidv4(),
            content: {historicalRecordFor: beliefId, recordedTruth: truth, timestamp},
            embedding: [],
            creationTime: timestamp, // Added
            lastAccessTime: timestamp, // Added
            meta: {
                type: 'Observation' as const,
                source: 'system_history_module',
                timestamp: new Date(timestamp).toISOString(),
                trust_score: 1.0
            }
        };
        (worldModel as PersistentWorldModel).add_atom(historyAtom);

        const historicalBelief = CognitiveItemFactory.createBelief(historyAtom.id, truth, {
            priority: 0.1,
            durability: 0.9
        });
        historicalBelief.label = `History: Truth of ${beliefId} at ${timestamp}`;
        historicalBelief.meta = {historicalRecordFor: beliefId, timestamp, isHistory: true};
        historicalBelief.stamp.timestamp = timestamp;
        return historicalBelief;
    };

    beforeEach(() => {
        worldModel = new PersistentWorldModel();
        const atom: SemanticAtom = {
            id: uuidv4(),
            content: "The sky is blue",
            embedding: [],
            creationTime: Date.now(), // Added
            lastAccessTime: Date.now(), // Added
            meta: {type: 'Fact' as const, source: 'test', timestamp: new Date().toISOString(), trust_score: 1.0}
        };
        worldModel.add_atom(atom);

        baseBelief = CognitiveItemFactory.createBelief(
            atom.id,
            {frequency: 1.0, confidence: 0.5},
            {priority: 0.5, durability: 0.5}
        );
        baseBelief.label = "Base Belief";
        worldModel.add_item(baseBelief);
    });

    it('should not generate an insight if history is too short', () => {
        const historyItem = createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, Date.now() - 10000);
        worldModel.add_item(historyItem);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(insights).toHaveLength(0);
    });

    it('should generate a stability insight for a belief that has not changed in a long time', () => {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        const stableTruth = {frequency: 1.0, confidence: 0.7};

        // Manually create history with identical truth values, with the last one being old
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 2 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.5 * ONE_HOUR));
        worldModel.add_item(createHistoryItem(baseBelief.id, stableTruth, now - 1.2 * ONE_HOUR));

        baseBelief.truth = stableTruth; // Set current belief to match
        worldModel.add_item(baseBelief);

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('stability');
    });

    it('should generate a trend_increasing insight for a belief with consistently increasing confidence', () => {
        const now = Date.now();
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.5}, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.7}, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('trend_increasing');
    });

    it('should generate an oscillation insight for a belief with contested frequency', () => {
        const now = Date.now();
        const constantConfidence = 0.9;
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.8,
            confidence: constantConfidence
        }, now - 40000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.2,
            confidence: constantConfidence
        }, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.9,
            confidence: constantConfidence
        }, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {
            frequency: 0.1,
            confidence: constantConfidence
        }, now - 10000));

        const insights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);

        expect(insights).toHaveLength(1);
        expect(insights[0].meta?.insightType).toBe('oscillation');
    });

    it('should not create duplicate meta-beliefs', () => {
        const now = Date.now();
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.5}, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.7}, now - 10000));

        const firstPassInsights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(firstPassInsights).toHaveLength(1);

        worldModel.add_item(firstPassInsights[0]);

        const secondPassInsights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(secondPassInsights).toHaveLength(0);
    });
});
});
        const now = Date.now();
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.5}, now - 30000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.6}, now - 20000));
        worldModel.add_item(createHistoryItem(baseBelief.id, {frequency: 1.0, confidence: 0.7}, now - 10000));

        const firstPassInsights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(firstPassInsights).toHaveLength(1);

        worldModel.add_item(firstPassInsights[0]);

        const secondPassInsights = HistoryAnalysisSchema.apply(baseBelief, {} as CognitiveItem, worldModel);
        expect(secondPassInsights).toHaveLength(0);
    });
});
