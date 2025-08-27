import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '../interfaces/types';
import {CognitiveSchema, WorldModel} from '../core/worldModel';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema} from './testUtils';

jest.mock('@/services/embeddingService');

describe('Medical Domain Tests', () => {
    let core: DecentralizedCognitiveCore;
    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {
        core = new DecentralizedCognitiveCore(2);
        mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.5));
    });

    it('should handle medical diagnosis scenarios', async () => {
        // Add medical knowledge
        const truth = createTruthValue({frequency: 0.9, confidence: 0.95});
        const attention = createAttentionValue({priority: 0.9, durability: 0.8});

        await core.addInitialBelief("Aspirin can help with heart disease", truth, attention,
            createCognitiveMetadata({
                domain: "medicine",
                source: "medical_journal",
                trust_score: 0.95
            })
        );

        await core.addInitialBelief("Aspirin can cause stomach bleeding", truth, attention,
            createCognitiveMetadata({
                domain: "medicine",
                source: "medical_journal",
                trust_score: 0.95
            })
        );

        await core.addInitialGoal("Diagnose patient with chest pain", attention,
            createCognitiveMetadata({
                domain: "medicine",
                source: "doctor"
            })
        );

        const status = core.getSystemStatus();
        expect(status.worldModelStats.atomCount).toBeGreaterThan(0);
    });
});