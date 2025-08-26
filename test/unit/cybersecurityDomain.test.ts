import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Cybersecurity Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle cybersecurity threat analysis scenarios', () => {
    // Add cybersecurity knowledge
    const truth: TruthValue = { frequency: 0.8, confidence: 0.85 };
    const attention: AttentionValue = { priority: 0.9, durability: 0.7 };

    core.addInitialBelief("Multi-factor authentication reduces account breaches", truth, attention, {
      domain: "cybersecurity",
      source: "security_research",
      trust_score: 0.9
    });

    core.addInitialBelief("Regular software updates patch security vulnerabilities", truth, attention, {
      domain: "cybersecurity",
      source: "security_research",
      trust_score: 0.92
    });

    core.addInitialGoal("Assess network security vulnerabilities", attention, {
      domain: "cybersecurity",
      source: "security_analyst"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});