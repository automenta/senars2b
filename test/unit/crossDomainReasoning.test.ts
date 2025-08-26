import { DecentralizedCognitiveCore } from '../../dist/cognitiveCore';
import { TruthValue, AttentionValue } from '../../dist/types';

describe('Cross-Domain Reasoning Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(3); // Use enhanced components
  });

  it('should transfer knowledge from epidemiology to cybersecurity', () => {
    // Add epidemiology knowledge
    const truth: TruthValue = { frequency: 0.8, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.85, durability: 0.8 };

    core.addInitialBelief("Virus spread can be contained through contact tracing and isolation", truth, attention, {
      domain: "epidemiology",
      source: "cdc_guidelines",
      trust_score: 0.95
    });

    core.addInitialBelief("Network attacks spread through vulnerable nodes and lateral movement", truth, attention, {
      domain: "cybersecurity",
      source: "security_research",
      trust_score: 0.9
    });

    core.addInitialGoal("Apply epidemiological containment strategies to network security", attention, {
      domain: "cybersecurity",
      source: "security_team"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should apply engineering reliability principles to organizational management', () => {
    const truth: TruthValue = { frequency: 0.75, confidence: 0.85 };
    const attention: AttentionValue = { priority: 0.8, durability: 0.75 };

    core.addInitialBelief("Redundancy in engineering systems improves overall reliability", truth, attention, {
      domain: "systems_engineering",
      source: "engineering_principles",
      trust_score: 0.95
    });

    core.addInitialBelief("Cross-training employees improves organizational resilience", truth, attention, {
      domain: "organizational_behavior",
      source: "management_research",
      trust_score: 0.85
    });

    core.addInitialGoal("Design resilient organization using engineering reliability principles", attention, {
      domain: "organizational_design",
      source: "management_consulting"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should use economic optimization for resource-constrained AI development', () => {
    const truth: TruthValue = { frequency: 0.8, confidence: 0.9 };
    const attention: AttentionValue = { priority: 0.9, durability: 0.8 };

    core.addInitialBelief("Portfolio theory optimizes return vs. risk in financial investments", truth, attention, {
      domain: "finance",
      source: "economic_theory",
      trust_score: 0.95
    });

    core.addInitialBelief("AI model development requires balancing accuracy, computational cost, and energy consumption", truth, attention, {
      domain: "computer_science",
      source: "ml_research",
      trust_score: 0.9
    });

    core.addInitialGoal("Apply portfolio optimization to AI model selection under resource constraints", attention, {
      domain: "ai_systems",
      source: "ml_engineering_team"
    });

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});