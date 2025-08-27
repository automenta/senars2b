import { DecentralizedCognitiveCore } from '../../src/core/cognitiveCore';
import { createTruthValue, createAttentionValue, createCognitiveMetadata } from './testUtils';

describe('Business Strategy Domain Tests', () => {
  let core: DecentralizedCognitiveCore;

  beforeEach(() => {
    core = new DecentralizedCognitiveCore(2);
  });

  it('should handle market analysis and competitive intelligence', () => {
    // Add business knowledge
    const truth = createTruthValue({ frequency: 0.8, confidence: 0.9 });
    const attention = createAttentionValue({ priority: 0.85, durability: 0.75 });

    core.addInitialBelief("Consumer preference for sustainable products is increasing", truth, attention, 
      createCognitiveMetadata({
        domain: "market_research",
        source: "consumer_survey",
        trust_score: 0.9
      })
    );

    core.addInitialBelief("Competitor X is investing heavily in green technology", truth, attention, 
      createCognitiveMetadata({
        domain: "competitive_intelligence",
        source: "industry_report",
        trust_score: 0.85
      })
    );

    core.addInitialGoal("Develop sustainable product strategy", attention, 
      createCognitiveMetadata({
        domain: "business_strategy",
        source: "executive_team"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });

  it('should handle resource allocation and risk management', () => {
    const truth = createTruthValue({ frequency: 0.7, confidence: 0.8 });
    const attention = createAttentionValue({ priority: 0.8, durability: 0.7 });

    core.addInitialBelief("R&D budget has 15% cut for next quarter", truth, attention, 
      createCognitiveMetadata({
        domain: "finance",
        source: "budget_committee",
        trust_score: 0.95
      })
    );

    core.addInitialBelief("Market expansion into Asia shows 25% growth potential", truth, attention, 
      createCognitiveMetadata({
        domain: "market_analysis",
        source: "economic_forecast",
        trust_score: 0.8
      })
    );

    core.addInitialGoal("Optimize resource allocation for maximum ROI", attention, 
      createCognitiveMetadata({
        domain: "business_operations",
        source: "management"
      })
    );

    const status = core.getSystemStatus();
    expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
  });
});