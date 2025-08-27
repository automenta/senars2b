import { SimpleBeliefRevisionEngine } from '../../src/core/beliefRevisionEngine';
import { TruthValue } from '../../src/interfaces/types';
import { createTruthValue } from './testUtils';

describe('SimpleBeliefRevisionEngine', () => {
  let revisionEngine: SimpleBeliefRevisionEngine;

  beforeEach(() => {
    revisionEngine = new SimpleBeliefRevisionEngine();
  });

  describe('merge', () => {
    it('should merge two truth values using weighted average', () => {
      const existing = createTruthValue({ frequency: 0.8, confidence: 0.9 });
      const newer = createTruthValue({ frequency: 0.6, confidence: 0.7 });

      const result = revisionEngine.merge(existing, newer);
      
      // Weighted average calculation:
      // frequency = (0.9 * 0.8 + 0.7 * 0.6) / (0.9 + 0.7) = (0.72 + 0.42) / 1.6 = 1.14 / 1.6 = 0.7125
      // confidence = min(0.99, (0.9 + 0.7) / 2 + 0.1) = min(0.99, 0.8 + 0.1) = 0.9
      expect(result.frequency).toBeCloseTo(0.7125, 4);
      expect(result.confidence).toBeCloseTo(0.9, 4);
    });

    it('should cap confidence at 0.99', () => {
      const existing = createTruthValue({ frequency: 0.8, confidence: 0.95 });
      const newer = createTruthValue({ frequency: 0.7, confidence: 0.95 });

      const result = revisionEngine.merge(existing, newer);
      
      // Confidence would be (0.95 + 0.95) / 2 + 0.1 = 0.95 + 0.1 = 1.05
      // But it should be capped at 0.99
      expect(result.confidence).toBeCloseTo(0.99, 4);
    });
  });

  describe('detect_conflict', () => {
    it('should detect conflict when frequency difference > 0.5 and both confidences > 0.7', () => {
      const truth1 = createTruthValue({ frequency: 0.9, confidence: 0.8 });
      const truth2 = createTruthValue({ frequency: 0.2, confidence: 0.85 });

      const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict when frequency difference <= 0.5', () => {
      const truth1 = createTruthValue({ frequency: 0.6, confidence: 0.8 });
      const truth2 = createTruthValue({ frequency: 0.3, confidence: 0.85 });

      const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when both confidences <= 0.7', () => {
      const truth1 = createTruthValue({ frequency: 0.9, confidence: 0.6 });
      const truth2 = createTruthValue({ frequency: 0.2, confidence: 0.65 });

      const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict when only one confidence > 0.7', () => {
      const truth1 = createTruthValue({ frequency: 0.9, confidence: 0.8 });
      const truth2 = createTruthValue({ frequency: 0.2, confidence: 0.6 });

      const hasConflict = revisionEngine.detect_conflict(truth1, truth2);
      expect(hasConflict).toBe(false);
    });
  });
});