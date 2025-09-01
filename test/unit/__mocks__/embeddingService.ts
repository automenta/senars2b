// Mock embedding service for faster tests
export const embeddingService = {
    generateEmbedding: jest.fn().mockImplementation(async (text: string) => {
        // Generate a deterministic embedding based on the text
        // This is much faster than actually calling a transformer model
        const hash = text.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
        // Return a smaller embedding for faster tests
        return Array(32).fill(0).map((_, i) => Math.abs(Math.sin(hash + i)) * 0.5 + 0.25);
    })
};