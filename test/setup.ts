jest.mock('../src/services/embeddingService', () => ({
  embeddingService: {
    generateEmbedding: jest.fn().mockResolvedValue(Array(768).fill(0.5)),
  },
}));
