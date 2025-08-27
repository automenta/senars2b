import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Financial Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle financial investment scenarios', () => {
    // Add financial knowledge
    const truth = createTruthValue({ frequency: 0.8, confidence: 0.9 });
    const attention = createAttentionValue({ priority: 0.8, durability: 0.7 });

    core.addInitialBelief("Tech stocks have high growth potential", truth, attention, 
      createCognitiveMetadata({
        domain: "finance",
        source: "market_analysis",
        trust_score: 0.85
      })
    );

    core.addInitialBelief("Tech stocks are volatile", truth, attention, 
      createCognitiveMetadata({
        domain: "finance",
        source: "market_analysis",
        trust_score: 0.9
      })
    );

    core.addInitialGoal("Create investment portfolio for retirement", attention, 
      createCognitiveMetadata({
        domain: "finance",
        source: "client"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});