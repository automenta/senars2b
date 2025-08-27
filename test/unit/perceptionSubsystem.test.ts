import {PerceptionSubsystem} from '@/modules/perceptionSubsystem';
import {embeddingService} from '@/services/embeddingService';

jest.mock('@/services/embeddingService');

describe('PerceptionSubsystem', () => {
    let perception: PerceptionSubsystem;
    const mockEmbeddingService = embeddingService as jest.Mocked<typeof embeddingService>;

    beforeEach(() => {
        perception = new PerceptionSubsystem();
        mockEmbeddingService.generateEmbedding.mockResolvedValue(Array(384).fill(0.5));
    });

    describe('processInput', () => {
        it('should process text input and return cognitive items', async () => {
            const input = "This is a test input about chocolate being toxic to pets.";

            const items = await perception.processInput(input);

            // Should return an array of cognitive items
            expect(Array.isArray(items)).toBe(true);

            // Each item should have required properties
            if (items.length > 0) {
                const item = items[0];
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('atom_id');
                expect(item).toHaveProperty('type');
                expect(item).toHaveProperty('attention');
                expect(item).toHaveProperty('stamp');
            }
        });

        it('should handle empty input', async () => {
            const input = "";

            const items = await perception.processInput(input);

            // Should return an array (could be empty)
            expect(Array.isArray(items)).toBe(true);
        });
    });
});