import {DecentralizedCognitiveCore} from '@/core/cognitiveCore';
import {
    createAttentionValue,
    createCognitiveMetadata,
    createCoreWithRealDependencies,
    createTruthValue
} from './testUtils';
import {embeddingService} from '@/services/embeddingService';

jest.mock('@/services/embeddingService');

describe('Financial Domain Tests', () => {
    let core: DecentralizedCognitiveCore;
    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {

        core = createCoreWithRealDependencies({workerCount: 2});
        mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.5));
    });

    it('should handle financial investment scenarios', async () => {
        // Add financial knowledge
        const truth = createTruthValue({frequency: 0.8, confidence: 0.9});
        const attention = createAttentionValue({priority: 0.8, durability: 0.7});

        await core.addInitialBelief("Tech stocks have high growth potential", truth, attention,
            createCognitiveMetadata({
                domain: "finance",
                source: "market_analysis",
                trust_score: 0.85
            })
        );

        await core.addInitialBelief("Tech stocks are volatile", truth, attention,
            createCognitiveMetadata({
                domain: "finance",
                source: "market_analysis",
                trust_score: 0.9
            })
        );

        await core.addInitialGoal("Create investment portfolio for retirement", attention,
            createCognitiveMetadata({
                domain: "finance",
                source: "client"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});