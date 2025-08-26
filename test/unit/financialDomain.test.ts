import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Financial Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle financial investment scenarios', () => {
    // Add financial knowledge
    const truth: TruthValue = { frequency: 0.8, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.8, durability: 0.7 };

    core.addInitialBelief("Tech stocks have high growth potential", truth, attention, {
      domain: "finance",
      source: "market_analysis",
      trust_score: 0.85
    });

    core.addInitialBelief("Tech stocks are volatile", truth, attention, {
      domain: "finance",
      source: "market_analysis",
      trust_score: 0.9
    });

    core.addInitialGoal("Create investment portfolio for retirement", attention, {
      domain: "finance",
      source: "client"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});