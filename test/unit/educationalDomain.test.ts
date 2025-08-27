import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '@/interfaces/types';
import {CognitiveSchema, WorldModel} from '@/core/worldModel';
import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema, createCognitiveMetadata} from './testUtils';

describe('Educational Domain Tests', () => {
    let core: DecentralizedCognitiveCore;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2);
    });

    it('should handle educational learning scenarios', () => {
        // Add educational knowledge
        const truth = createTruthValue({frequency: 0.9, confidence: 0.95});
        const attention = createAttentionValue({priority: 0.7, durability: 0.8});

        core.addInitialBelief("Active recall improves memory retention", truth, attention,
            createCognitiveMetadata({
                domain: "education",
                source: "cognitive_science_research",
                trust_score: 0.95
            })
        );

        core.addInitialBelief("Spaced repetition enhances long-term learning", truth, attention,
            createCognitiveMetadata({
                domain: "education",
                source: "educational_psychology",
                trust_score: 0.92
            })
        );

        core.addInitialGoal("Create study plan for mathematics", attention,
            createCognitiveMetadata({
                domain: "education",
                source: "student"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});