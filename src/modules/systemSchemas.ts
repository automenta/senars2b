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

/**
 * A system-level schema to analyze the history of a belief for patterns.
 * This schema generates "meta-beliefs" about trends, stability, or oscillations.
 */
export const HistoryAnalysisSchema: CognitiveSchema = {
    atom_id: 'SCHEMA_SYSTEM_HISTORY_ANALYZER',

    apply: (itemA: CognitiveItem, itemB: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
        // This schema is designed to be unary, operating on a single belief item.
        // It triggers on any belief that is not itself a historical record or a meta-belief.
        const belief = (itemA.type === 'BELIEF' && !itemA.meta?.isHistory && !itemA.meta?.analysisOf) ? itemA :
                       (itemB.type === 'BELIEF' && !itemB.meta?.isHistory && !itemB.meta?.analysisOf) ? itemB :
                       null;

        if (!belief) {
            return []; // Not applicable
        }

        // The getItemHistory method is on PersistentWorldModel, not the WorldModel interface.
        // We cast to `any` to access it. A proper fix would be to add it to the interface.
        const history = (worldModel as any).getItemHistory(belief.id);

        // We need at least a few data points to identify a meaningful pattern.
        if (history.length < 3) {
            return [];
        }

        // Helper to create the meta-belief cognitive item
        const createMetaBelief = (insightType: string, label: string): CognitiveItem => {
            const metaAtom = {
                id: uuidv4(),
                content: { insightType, label, analyzedBelief: belief.id },
                embedding: [],
                meta: {
                    type: 'Observation' as const,
                    source: 'system_history_analyzer',
                    timestamp: new Date().toISOString(),
                    trust_score: 1.0,
                    domain: 'system_internals'
                }
            };
            worldModel.add_atom(metaAtom);

            const metaBelief = CognitiveItemFactory.createBelief(
                metaAtom.id,
                { frequency: 1.0, confidence: 0.9 }, // Meta-beliefs are asserted with high confidence
                { priority: 0.3, durability: 0.8 }
            );
            metaBelief.label = label;
            metaBelief.meta = {
                analysisOf: belief.id,
                insightType: insightType,
            };
            return metaBelief;
        };

        // --- Analysis Functions ---

        const analyzeStability = (hist: CognitiveItem[]): CognitiveItem | null => {
            const STABILITY_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
            const lastChange = hist[0].stamp.timestamp; // History is sorted descending by timestamp
            if (Date.now() - lastChange > STABILITY_THRESHOLD_MS) {
                return createMetaBelief('stability', `Belief ${belief.id.substring(0, 8)}... is stable.`);
            }
            return null;
        };

        const analyzeTrend = (hist: CognitiveItem[]): CognitiveItem | null => {
            const TREND_THRESHOLD = 0.05; // Required average confidence change per step
            // History is newest-to-oldest, so reverse it first to get a proper time series.
            const points = hist.slice().reverse().map((h, i) => ({ x: i, y: h.truth!.confidence }));

            // Simple linear regression slope calculation
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            const n = points.length;
            for(const p of points) {
                sumX += p.x;
                sumY += p.y;
                sumXY += p.x * p.y;
                sumXX += p.x * p.x;
            }
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

            if (slope > TREND_THRESHOLD) {
                return createMetaBelief('trend_increasing', `Confidence in belief ${belief.id.substring(0, 8)}... is increasing.`);
            }
            if (slope < -TREND_THRESHOLD) {
                return createMetaBelief('trend_decreasing', `Confidence in belief ${belief.id.substring(0, 8)}... is decreasing.`);
            }
            return null;
        };

        const analyzeOscillation = (hist: CognitiveItem[]): CognitiveItem | null => {
            const OSCILLATION_THRESHOLD = 3; // Number of times frequency must cross 0.5
            let crossings = 0;
            for (let i = 1; i < hist.length; i++) {
                const prevFreq = hist[i].truth!.frequency;
                const currFreq = hist[i-1].truth!.frequency;
                if ((prevFreq < 0.5 && currFreq >= 0.5) || (prevFreq > 0.5 && currFreq <= 0.5)) {
                    crossings++;
                }
            }
            if (crossings >= OSCILLATION_THRESHOLD) {
                return createMetaBelief('oscillation', `Belief ${belief.id.substring(0, 8)}... is oscillating/contested.`);
            }
            return null;
        };

        // --- Execution ---

        // Check for existing meta-beliefs to avoid creating duplicates
        const existingMetaBeliefs = (worldModel as any).query_by_meta('analysisOf', belief.id);
        const existingInsights = new Set(existingMetaBeliefs.map((b: CognitiveItem) => b.meta?.insightType));

        // Analyses are mutually exclusive, prioritized by significance.
        let insight: CognitiveItem | null;

        // 1. Check for Stability
        insight = analyzeStability(history);
        if (insight && !existingInsights.has(insight.meta!.insightType)) {
            return [insight];
        }

        // 2. Check for Oscillation
        insight = analyzeOscillation(history);
        if (insight && !existingInsights.has(insight.meta!.insightType)) {
            return [insight];
        }

        // 3. Check for Trend
        insight = analyzeTrend(history);
        if (insight && !existingInsights.has(insight.meta!.insightType)) {
            return [insight];
        }

        return []; // No new, applicable insights found
    }
};
