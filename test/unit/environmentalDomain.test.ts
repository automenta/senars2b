import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Environmental Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle environmental science scenarios', () => {
    // Add environmental knowledge
    const truth: TruthValue = { frequency: 0.95, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.85, durability: 0.8 };

    core.addInitialBelief("Renewable energy reduces carbon emissions", truth, attention, {
      domain: "environmental_science",
      source: "scientific_journal",
      trust_score: 0.95
    });

    core.addInitialBelief("Deforestation contributes to climate change", truth, attention, {
      domain: "environmental_science",
      source: "scientific_journal",
      trust_score: 0.95
    });

    core.addInitialGoal("Develop sustainable urban planning strategy", attention, {
      domain: "environmental_science",
      source: "city_planner"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});