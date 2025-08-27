import {HuggingFaceTransformersEmbeddings} from "@langchain/community/embeddings/hf_transformers";

class EmbeddingService {
    private static instance: EmbeddingService;
    private embeddings: HuggingFaceTransformersEmbeddings;

    private constructor() {
        this.embeddings = new HuggingFaceTransformersEmbeddings({
            modelName: "Xenova/all-MiniLM-L6-v2",
        });
    }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        // This process can be slow the first time as it downloads the model.
        return this.embeddings.embedQuery(text);
    }

    public async generateEmbeddings(texts: string[]): Promise<number[][]> {
        return this.embeddings.embedDocuments(texts);
    }
}

export const embeddingService = EmbeddingService.getInstance();
