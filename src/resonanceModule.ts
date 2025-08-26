import { ResonanceModule, CognitiveItem, WorldModel, UUID } from './types';

export class HybridResonanceModule implements ResonanceModule {
    find_context(item: CognitiveItem, world_model: WorldModel, k: number): CognitiveItem[] {
        // Find contextually relevant items using hybrid retrieval
        // Combines semantic similarity, symbolic overlap, goal relevance, recency, and trust
        
        // Get the query item's atom
        const queryAtom = world_model.get_atom(item.atom_id);
        if (!queryAtom) return [];
        
        // Get candidates from different query methods
        const semanticMatches = world_model.query_by_semantic(queryAtom.embedding, k * 2);
        const symbolicMatches = world_model.query_by_symbolic(queryAtom.content, k * 2);
        const structuralMatches = world_model.query_by_structure(queryAtom.content, k);
        
        // Combine and deduplicate
        const allMatches = [...semanticMatches, ...symbolicMatches, ...structuralMatches];
        const uniqueMatches = Array.from(new Map(allMatches.map(item => [item.id, item])).values());
        
        // Filter out the query item itself
        const filteredMatches = uniqueMatches.filter(match => match.id !== item.id);
        
        // Score each candidate based on multiple factors
        const scoredMatches = filteredMatches.map(match => ({
            item: match,
            score: this.calculateRelevanceScore(item, match, world_model)
        }));
        
        // Sort by score and return top k
        return scoredMatches
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map(scored => scored.item);
    }
    
    private calculateRelevanceScore(queryItem: CognitiveItem, candidateItem: CognitiveItem, world_model: WorldModel): number {
        // Calculate a composite relevance score based on multiple factors
        
        // Semantic similarity (0-1)
        const semanticScore = this.calculateSemanticSimilarity(queryItem, candidateItem, world_model);
        
        // Symbolic overlap (0-1)
        const symbolicScore = this.calculateSymbolicOverlap(queryItem, candidateItem, world_model);
        
        // Structural similarity (0-1)
        const structuralScore = this.calculateStructuralSimilarity(queryItem, candidateItem, world_model);
        
        // Goal relevance (0-1)
        const goalScore = this.calculateGoalRelevance(queryItem, candidateItem);
        
        // Recency factor (0-1)
        const recencyScore = this.calculateRecencyFactor(queryItem, candidateItem);
        
        // Trust score (0-1)
        const trustScore = this.calculateTrustScore(candidateItem, world_model);
        
        // Diversity factor (0-1) - promotes diverse context
        const diversityScore = this.calculateDiversityFactor(candidateItem, world_model);
        
        // Weighted combination of all factors
        return (
            semanticScore * 0.25 +
            symbolicScore * 0.2 +
            structuralScore * 0.15 +
            goalScore * 0.15 +
            recencyScore * 0.1 +
            trustScore * 0.1 +
            diversityScore * 0.05
        );
    }
    
    private calculateSemanticSimilarity(itemA: CognitiveItem, itemB: CognitiveItem, world_model: WorldModel): number {
        // Compute cosine similarity between embeddings
        const atomA = world_model.get_atom(itemA.atom_id);
        const atomB = world_model.get_atom(itemB.atom_id);
        
        if (!atomA || !atomB || !atomA.embedding || !atomB.embedding) {
            return 0;
        }
        
        return this.calculateCosineSimilarity(atomA.embedding, atomB.embedding);
    }
    
    private calculateSymbolicOverlap(itemA: CognitiveItem, itemB: CognitiveItem, world_model: WorldModel): number {
        // Calculate overlap in symbolic content
        const atomA = world_model.get_atom(itemA.atom_id);
        const atomB = world_model.get_atom(itemB.atom_id);
        
        if (!atomA || !atomB) return 0;
        
        // Simple string overlap calculation
        const strA = JSON.stringify(atomA.content);
        const strB = JSON.stringify(atomB.content);
        
        // Calculate Jaccard similarity
        const setA = new Set(strA.toLowerCase().split(/\W+/).filter(w => w.length > 0));
        const setB = new Set(strB.toLowerCase().split(/\W+/).filter(w => w.length > 0));
        
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    private calculateStructuralSimilarity(itemA: CognitiveItem, itemB: CognitiveItem, world_model: WorldModel): number {
        // Calculate structural similarity between items
        const atomA = world_model.get_atom(itemA.atom_id);
        const atomB = world_model.get_atom(itemB.atom_id);
        
        if (!atomA || !atomB) return 0;
        
        // Simple structural similarity based on object keys
        if (typeof atomA.content === 'object' && typeof atomB.content === 'object') {
            const keysA = Object.keys(atomA.content);
            const keysB = Object.keys(atomB.content);
            
            if (keysA.length === 0 && keysB.length === 0) return 1;
            if (keysA.length === 0 || keysB.length === 0) return 0;
            
            const commonKeys = keysA.filter(key => keysB.includes(key));
            return commonKeys.length / Math.max(keysA.length, keysB.length);
        }
        
        return 0;
    }
    
    private calculateGoalRelevance(itemA: CognitiveItem, itemB: CognitiveItem): number {
        // Check if items are related through goal hierarchy
        if (itemA.goal_parent_id === itemB.id || itemB.goal_parent_id === itemA.id) {
            return 1.0;
        }
        
        if (itemA.goal_parent_id && itemB.goal_parent_id && itemA.goal_parent_id === itemB.goal_parent_id) {
            return 0.8;
        }
        
        // Check if they share a common ancestor
        const ancestorsA = this.getGoalAncestors(itemA);
        const ancestorsB = this.getGoalAncestors(itemB);
        const commonAncestors = ancestorsA.filter(id => ancestorsB.includes(id));
        
        if (commonAncestors.length > 0) {
            return 0.6;
        }
        
        // Check if one is a subgoal of the other
        if (ancestorsA.includes(itemB.id) || ancestorsB.includes(itemA.id)) {
            return 0.5;
        }
        
        return 0.1; // Base relevance
    }
    
    private getGoalAncestors(item: CognitiveItem): UUID[] {
        const ancestors: UUID[] = [];
        let currentId = item.goal_parent_id;
        
        // Limit traversal to prevent infinite loops
        let depth = 0;
        const maxDepth = 10;
        
        while (currentId && depth < maxDepth) {
            ancestors.push(currentId);
            // In a real implementation, we would traverse the actual hierarchy
            // For now, we'll just break since we don't have access to the full hierarchy
            break;
        }
        
        return ancestors;
    }
    
    private calculateRecencyFactor(queryItem: CognitiveItem, candidateItem: CognitiveItem): number {
        // Calculate recency factor based on both items
        const now = Date.now();
        const queryAge = now - queryItem.stamp.timestamp;
        const candidateAge = now - candidateItem.stamp.timestamp;
        
        // More recent items have higher relevance, but also consider temporal proximity
        const queryRecency = Math.exp(-queryAge / (1000 * 60 * 60 * 24)); // Decay over days
        const candidateRecency = Math.exp(-candidateAge / (1000 * 60 * 60 * 24));
        const temporalProximity = Math.exp(-Math.abs(queryAge - candidateAge) / (1000 * 60 * 60 * 24));
        
        // Combine factors
        return (queryRecency + candidateRecency + temporalProximity) / 3;
    }
    
    private calculateTrustScore(item: CognitiveItem, world_model: WorldModel): number {
        // Get trust score from the atom's metadata
        const atom = world_model.get_atom(item.atom_id);
        return atom?.meta.trust_score || 0.5;
    }
    
    private calculateDiversityFactor(item: CognitiveItem, world_model: WorldModel): number {
        // Promote diversity in context by reducing score for similar items already selected
        // In a real implementation, we would track previously selected items
        // For now, we'll use a placeholder that slightly favors less common items
        const atom = world_model.get_atom(item.atom_id);
        if (!atom) return 0.5;
        
        // Use a simple heuristic based on content length
        const contentStr = typeof atom.content === 'string' ? 
            atom.content : 
            JSON.stringify(atom.content);
            
        // Longer, more detailed content is considered more diverse
        return Math.min(1.0, contentStr.length / 1000);
    }
    
    private calculateCosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length || a.length === 0) return 0;
        
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }
        
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        
        return dotProduct / (magnitudeA * magnitudeB);
    }
}