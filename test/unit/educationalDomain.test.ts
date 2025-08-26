import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Educational Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle educational learning scenarios', () => {
    // Add educational knowledge
    const truth: TruthValue = { frequency: 0.9, confidence: 0.95 };
    const attention: AttentionValue = { priority: 0.7, durability: 0.8 };

    core.addInitialBelief("Active recall improves memory retention", truth, attention, {
      domain: "education",
      source: "cognitive_science_research",
      trust_score: 0.95
    });

    core.addInitialBelief("Spaced repetition enhances long-term learning", truth, attention, {
      domain: "education",
      source: "educational_psychology",
      trust_score: 0.92
    });

    core.addInitialGoal("Create study plan for mathematics", attention, {
      domain: "education",
      source: "student"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});