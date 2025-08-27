import { BeliefRevisionEngine, TruthValue, CognitiveItem } from '../interfaces/types';

export class SimpleBeliefRevisionEngine implements BeliefRevisionEngine {
    merge(existing: TruthValue, newTv: TruthValue): TruthValue {
        const w1 = existing.confidence;
        const w2 = newTv.confidence;
        const total = w1 + w2;
        
        return {
            frequency: (w1 * existing.frequency + w2 * newTv.frequency) / total,
            confidence: Math.min(0.99, (w1 + w2) / 2 + 0.1)
        };
    }

    detect_conflict(a: TruthValue, b: TruthValue): boolean {
        return Math.abs(a.frequency - b.frequency) > 0.5 && 
               a.confidence > 0.7 && 
               b.confidence > 0.7;
    }
    
    resolve_conflict(existingItem: CognitiveItem, newItem: CognitiveItem): CognitiveItem {
        // Resolve conflict between two beliefs
        if (!existingItem.truth || !newItem.truth) {
            // If one doesn't have truth values, return the one that does
            return existingItem.truth ? existingItem : newItem;
        }
        
        // Check if there's actually a conflict
        if (!this.detect_conflict(existingItem.truth, newItem.truth)) {
            // No conflict, merge normally
            return {
                ...existingItem,
                truth: this.merge(existingItem.truth, newItem.truth)
            };
        }
        
        // There is a conflict, apply conflict resolution strategy
        // Strategy: Keep the belief with higher confidence, but lower the confidence of the result
        const higherConfidenceItem = existingItem.truth.confidence > newItem.truth.confidence ? existingItem : newItem;
        return {
            ...higherConfidenceItem,
            truth: {
                frequency: higherConfidenceItem.truth.frequency,
                confidence: Math.max(0.1, higherConfidenceItem.truth.confidence * 0.8) // Lower confidence
            }
        };
    }
}