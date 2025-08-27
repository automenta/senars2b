import { DecentralizedCognitiveCore } from '../src/core/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Environmental Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle environmental science scenarios', () => {
    // Add environmental knowledge
    const truth = createTruthValue({ frequency: 0.95, confidence: 0.9 });
    const attention = createAttentionValue({ priority: 0.85, durability: 0.8 });

    core.addInitialBelief("Renewable energy reduces carbon emissions", truth, attention, 
      createCognitiveMetadata({
        domain: "environmental_science",
        source: "scientific_journal",
        trust_score: 0.95
      })
    );

    core.addInitialBelief("Deforestation contributes to climate change", truth, attention, 
      createCognitiveMetadata({
        domain: "environmental_science",
        source: "scientific_journal",
        trust_score: 0.95
      })
    );

    core.addInitialGoal("Develop sustainable urban planning strategy", attention, 
      createCognitiveMetadata({
        domain: "environmental_science",
        source: "city_planner"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});