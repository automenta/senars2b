import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Legal Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle legal reasoning scenarios', () => {
    // Add legal knowledge
    const truth = createTruthValue({ frequency: 1.0, confidence: 0.95 });
    const attention = createAttentionValue({ priority: 0.9, durability: 0.9 });

    core.addInitialBelief("Contracts require offer, acceptance, and consideration", truth, attention, 
      createCognitiveMetadata({
        domain: "law",
        source: "legal_code",
        trust_score: 0.99
      })
    );

    core.addInitialBelief("Evidence must be relevant and material to be admissible", truth, attention, 
      createCognitiveMetadata({
        domain: "law",
        source: "legal_code",
        trust_score: 0.99
      })
    );

    core.addInitialGoal("Analyze contract dispute case", attention, 
      createCognitiveMetadata({
        domain: "law",
        source: "attorney"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});