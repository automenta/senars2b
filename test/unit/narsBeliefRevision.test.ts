import {SimpleBeliefRevisionEngine} from '@/core/beliefRevisionEngine';
import {CognitiveItemFactory} from '@/modules/cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';

describe('NARS Belief Revision Tests', () => {
    let revisionEngine: SimpleBeliefRevisionEngine;
    
    beforeEach(() => {
        revisionEngine = new SimpleBeliefRevisionEngine();
    });
    
    describe('Belief Merging', () => {
        it('should merge two beliefs with high confidence', () => {
            const existing = { frequency: 0.8, confidence: 0.9 };
            const newer = { frequency: 0.7, confidence: 0.8 };
            
            const result = revisionEngine.merge(existing, newer);
            
            // Weighted average calculation:
            // frequency = (0.9 * 0.8 + 0.8 * 0.7) / (0.9 + 0.8) = (0.72 + 0.56) / 1.7 = 1.28 / 1.7 ≈ 0.753
            // confidence = min(0.99, (0.9 + 0.8) / 2 + 0.1) = min(0.99, 0.85 + 0.1) = 0.95
            expect(result.frequency).toBeCloseTo(0.753, 3);
            expect(result.confidence).toBeCloseTo(0.95, 3);
        });
        
        it('should merge beliefs with different confidence levels', () => {
            const existing = { frequency: 0.6, confidence: 0.5 };
            const newer = { frequency: 0.9, confidence: 0.8 };
            
            const result = revisionEngine.merge(existing, newer);
            
            // Weighted average calculation:
            // frequency = (0.5 * 0.6 + 0.8 * 0.9) / (0.5 + 0.8) = (0.3 + 0.72) / 1.3 = 1.02 / 1.3 ≈ 0.785
            // confidence = min(0.99, (0.5 + 0.8) / 2 + 0.1) = min(0.99, 0.65 + 0.1) = 0.75
            expect(result.frequency).toBeCloseTo(0.785, 3);
            expect(result.confidence).toBeCloseTo(0.75, 3);
        });
        
        it('should cap confidence at 0.99', () => {
            const existing = { frequency: 0.8, confidence: 0.95 };
            const newer = { frequency: 0.7, confidence: 0.95 };
            
            const result = revisionEngine.merge(existing, newer);
            
            // Confidence would be (0.95 + 0.95) / 2 + 0.1 = 0.95 + 0.1 = 1.05
            // But it should be capped at 0.99
            expect(result.confidence).toBeCloseTo(0.99, 3);
        });
    });
    
    describe('Conflict Detection', () => {
        it('should detect conflict when frequency difference > 0.5 and both confidences > 0.7', () => {
            const truth1 = { frequency: 0.9, confidence: 0.8 };
            const truth2 = { frequency: 0.2, confidence: 0.85 };
            
            const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
            expect(hasConflict).toBe(true);
        });
        
        it('should not detect conflict when frequency difference <= 0.5', () => {
            const truth1 = { frequency: 0.6, confidence: 0.8 };
            const truth2 = { frequency: 0.3, confidence: 0.85 };
            
            const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
            expect(hasConflict).toBe(false);
        });
        
        it('should not detect conflict when both confidences <= 0.7', () => {
            const truth1 = { frequency: 0.9, confidence: 0.6 };
            const truth2 = { frequency: 0.2, confidence: 0.65 };
            
            const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
            expect(hasConflict).toBe(false);
        });
        
        it('should not detect conflict when only one confidence > 0.7', () => {
            const truth1 = { frequency: 0.9, confidence: 0.8 };
            const truth2 = { frequency: 0.2, confidence: 0.6 };
            
            const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
            expect(hasConflict).toBe(false);
        });
    });
    
    describe('Conflict Resolution', () => {
        it('should merge beliefs when there is no conflict', () => {
            // Create two cognitive items (beliefs)
            const atomId = uuidv4();
            const existingItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.7, confidence: 0.6 },
                { priority: 0.5, durability: 0.5 }
            );
            existingItem.label = "Test belief";
            
            const newItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.8, confidence: 0.7 },
                { priority: 0.6, durability: 0.6 }
            );
            newItem.label = "Test belief";
            
            const result = revisionEngine.resolve_conflict(existingItem, newItem);
            
            // Should be merged since there's no conflict
            // Weighted average calculation:
            // frequency = (0.6 * 0.7 + 0.7 * 0.8) / (0.6 + 0.7) = (0.42 + 0.56) / 1.3 = 0.98 / 1.3 ≈ 0.7538
            // confidence = min(0.99, (0.6 + 0.7) / 2 + 0.1) = min(0.99, 0.65 + 0.1) = 0.75
            expect(result.truth?.frequency).toBeCloseTo(0.754, 3);
            expect(result.truth?.confidence).toBeCloseTo(0.75, 3);
        });
        
        it('should resolve conflict by keeping higher confidence belief', () => {
            // Create two conflicting cognitive items (beliefs)
            const atomId = uuidv4();
            const existingItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.9, confidence: 0.8 },
                { priority: 0.5, durability: 0.5 }
            );
            existingItem.label = "All swans are white";
            
            const newItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.1, confidence: 0.9 }, // Conflicting belief with higher confidence
                { priority: 0.6, durability: 0.6 }
            );
            newItem.label = "This swan is black";
            
            const result = revisionEngine.resolve_conflict(existingItem, newItem);
            
            // Should keep the newItem (higher confidence) but lower the confidence
            expect(result.truth?.frequency).toBeCloseTo(0.1, 3);
            expect(result.truth?.confidence).toBeCloseTo(0.72, 3); // 0.9 * 0.8 = 0.72
        });
        
        it('should handle conflict resolution with equal confidence', () => {
            // Create two conflicting cognitive items (beliefs) with equal confidence
            const atomId = uuidv4();
            const existingItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.9, confidence: 0.8 },
                { priority: 0.5, durability: 0.5 }
            );
            existingItem.label = "It will rain tomorrow";
            
            const newItem = CognitiveItemFactory.createBelief(
                atomId,
                { frequency: 0.2, confidence: 0.8 }, // Conflicting belief with equal confidence
                { priority: 0.6, durability: 0.6 }
            );
            newItem.label = "It will not rain tomorrow";
            
            const result = revisionEngine.resolve_conflict(existingItem, newItem);
            
            // Should keep the newItem (it comes later) but lower the confidence
            expect(result.truth?.frequency).toBeCloseTo(0.2, 3);
            expect(result.truth?.confidence).toBeCloseTo(0.64, 3); // 0.8 * 0.8 = 0.64
        });
    });
    
    describe('Integration with World Model', () => {
        it('should properly revise beliefs in the world model', () => {
            // This test would typically involve the world model, but we're just checking
            // that the revision engine works correctly with the data structures
            const atomId = uuidv4();
            const existingTruth = { frequency: 0.8, confidence: 0.7 };
            const newTruth = { frequency: 0.6, confidence: 0.8 };
            
            // Test merging
            // Weighted average calculation:
            // frequency = (0.7 * 0.8 + 0.8 * 0.6) / (0.7 + 0.8) = (0.56 + 0.48) / 1.5 = 1.04 / 1.5 ≈ 0.6933
            // confidence = min(0.99, (0.7 + 0.8) / 2 + 0.1) = min(0.99, 0.75 + 0.1) = 0.85
            const mergedTruth = revisionEngine.merge(existingTruth, newTruth);
            expect(mergedTruth.frequency).toBeCloseTo(0.693, 3);
            expect(mergedTruth.confidence).toBeCloseTo(0.85, 3);
            
            // Test conflict detection
            const conflictingTruth1 = { frequency: 0.9, confidence: 0.8 };
            const conflictingTruth2 = { frequency: 0.2, confidence: 0.85 };
            const hasConflict = revisionEngine.detect_conflict(conflictingTruth1, conflictingTruth2);
            expect(hasConflict).toBe(true);
            
            // Test conflict resolution
            const existingItem = CognitiveItemFactory.createBelief(
                atomId,
                conflictingTruth1,
                { priority: 0.5, durability: 0.5 }
            );
            existingItem.label = "Conflicting belief 1";
            
            const newItem = CognitiveItemFactory.createBelief(
                atomId,
                conflictingTruth2,
                { priority: 0.6, durability: 0.6 }
            );
            newItem.label = "Conflicting belief 2";
            
            const resolvedItem = revisionEngine.resolve_conflict(existingItem, newItem);
            expect(resolvedItem.truth?.frequency).toBeCloseTo(0.2, 3);
            expect(resolvedItem.truth?.confidence).toBeCloseTo(0.68, 3); // 0.85 * 0.8 = 0.68
        });
    });
});