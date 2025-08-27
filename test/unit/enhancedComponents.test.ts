import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Enhanced Components Integration Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should work with standard components and process multi-domain knowledge', () => {
    // Add knowledge from multiple domains
    const truth = createTruthValue({ frequency: 0.8, confidence: 0.9 });
    const attention = createAttentionValue({ priority: 0.8, durability: 0.7 });

    core.addInitialBelief("Machine learning algorithm achieves 95% accuracy", truth, attention, 
      createCognitiveMetadata({
        domain: "computer_science",
        source: "research_paper",
        trust_score: 0.9
      })
    );

    core.addInitialBelief("Drug compound shows promising results in trials", truth, attention, 
      createCognitiveMetadata({
        domain: "pharmacology",
        source: "clinical_study",
        trust_score: 0.85
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should handle cross-domain reasoning scenarios', () => {
    const truth = createTruthValue({ frequency: 0.7, confidence: 0.8 });
    const attention = createAttentionValue({ priority: 0.7, durability: 0.6 });

    core.addInitialBelief("Economic indicator shows positive trend", truth, attention, 
      createCognitiveMetadata({
        domain: "economics",
        source: "government_report",
        trust_score: 0.8
      })
    );

    core.addInitialGoal("Analyze market conditions for investment strategy", attention, 
      createCognitiveMetadata({
        domain: "finance",
        source: "investment_firm"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should support analogical reasoning across domains', () => {
    const truth = createTruthValue({ frequency: 0.75, confidence: 0.85 });
    const attention = createAttentionValue({ priority: 0.8, durability: 0.7 });

    // Add knowledge from different domains that could benefit from analogical reasoning
    core.addInitialBelief("Neural networks learn through backpropagation", truth, attention, 
      createCognitiveMetadata({
        domain: "computer_science",
        source: "textbook",
        trust_score: 0.9
      })
    );

    core.addInitialBelief("Human brains learn through synaptic plasticity", truth, attention, 
      createCognitiveMetadata({
        domain: "neuroscience",
        source: "scientific_journal",
        trust_score: 0.95
      })
    );

    core.addInitialGoal("Apply insights from biological learning to improve AI algorithms", attention, 
      createCognitiveMetadata({
        domain: "cognitive_science",
        source: "researcher"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});