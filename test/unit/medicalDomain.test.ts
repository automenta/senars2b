import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Medical Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle medical diagnosis scenarios', () => {
    // Add medical knowledge
    const truth: TruthValue = { frequency: 0.9, confidence: 0.95 };
    const attention: AttentionValue = { priority: 0.9, durability: 0.8 };

    core.addInitialBelief("Aspirin can help with heart disease", truth, attention, {
      domain: "medicine",
      source: "medical_journal",
      trust_score: 0.95
    });

    core.addInitialBelief("Aspirin can cause stomach bleeding", truth, attention, {
      domain: "medicine",
      source: "medical_journal",
      trust_score: 0.95
    });

    core.addInitialGoal("Diagnose patient with chest pain", attention, {
      domain: "medicine",
      source: "doctor"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});