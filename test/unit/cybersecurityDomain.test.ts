import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {createAttentionValue, createCognitiveMetadata, createTruthValue} from './testUtils';

describe('Cybersecurity Domain Tests', () => {
    let core: DecentralizedCognitiveCore;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2);
    });

    it('should handle cybersecurity threat analysis scenarios', () => {
        // Add cybersecurity knowledge
        const truth = createTruthValue({frequency: 0.8, confidence: 0.85});
        const attention = createAttentionValue({priority: 0.9, durability: 0.7});

        core.addInitialBelief("Multi-factor authentication reduces account breaches", truth, attention,
            createCognitiveMetadata({
                domain: "cybersecurity",
                source: "security_research",
                trust_score: 0.9
            })
        );

        core.addInitialBelief("Regular software updates patch security vulnerabilities", truth, attention,
            createCognitiveMetadata({
                domain: "cybersecurity",
                source: "security_research",
                trust_score: 0.92
            })
        );

        core.addInitialGoal("Assess network security vulnerabilities", attention,
            createCognitiveMetadata({
                domain: "cybersecurity",
                source: "security_analyst"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});