import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Scientific Research Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle scientific hypothesis generation and testing', () => {
    // Add scientific knowledge
    const truth = createTruthValue({ frequency: 0.7, confidence: 0.8 });
    const attention = createAttentionValue({ priority: 0.8, durability: 0.7 });

    core.addInitialBelief("Increased CO2 levels correlate with temperature rise", truth, attention, 
      createCognitiveMetadata({
        domain: "climate_science",
        source: "peer_reviewed_study",
        trust_score: 0.95
      })
    );

    core.addInitialBelief("Solar radiation has cycles that affect climate", truth, attention, 
      createCognitiveMetadata({
        domain: "astrophysics",
        source: "scientific_journal",
        trust_score: 0.9
      })
    );

    core.addInitialGoal("Formulate hypothesis about climate change drivers", attention, 
      createCognitiveMetadata({
        domain: "climate_science",
        source: "researcher"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should handle experimental design scenarios', () => {
    const truth = createTruthValue({ frequency: 0.6, confidence: 0.7 });
    const attention = createAttentionValue({ priority: 0.7, durability: 0.6 });

    core.addInitialBelief("Drug A shows 70% efficacy in vitro", truth, attention, 
      createCognitiveMetadata({
        domain: "pharmacology",
        source: "lab_results",
        trust_score: 0.8
      })
    );

    core.addInitialBelief("Drug A has toxicity concerns in animal models", truth, attention, 
      createCognitiveMetadata({
        domain: "toxicology",
        source: "animal_study",
        trust_score: 0.85
      })
    );

    core.addInitialGoal("Design clinical trial protocol for Drug A", attention, 
      createCognitiveMetadata({
        domain: "clinical_research",
        source: "pharmaceutical_company"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});