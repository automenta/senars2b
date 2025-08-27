import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '../interfaces/types';
import {CognitiveSchema, WorldModel} from '../core/worldModel';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema} from './testUtils';
import {embeddingService} from '@/services/embeddingService';

jest.mock('@/services/embeddingService');

describe('Legal Domain Tests', () => {
    let core: DecentralizedCognitiveCore;
    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2);
        mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.5));
    });

    it('should handle legal reasoning scenarios', async () => {
        // Add legal knowledge
        const truth = createTruthValue({frequency: 1.0, confidence: 0.95});
        const attention = createAttentionValue({priority: 0.9, durability: 0.9});

        await core.addInitialBelief("Contracts require offer, acceptance, and consideration", truth, attention,
            createCognitiveMetadata({
                domain: "law",
                source: "legal_code",
                trust_score: 0.99
            })
        );

        await core.addInitialBelief("Evidence must be relevant and material to be admissible", truth, attention,
            createCognitiveMetadata({
                domain: "law",
                source: "legal_code",
                trust_score: 0.99
            })
        );

        await core.addInitialGoal("Analyze contract dispute case", attention,
            createCognitiveMetadata({
                domain: "law",
                source: "attorney"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});