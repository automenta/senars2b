import { Executor, CognitiveItem } from './types';
import { CognitiveItemFactory } from './cognitiveItemFactory';

export class WebSearchExecutor implements Executor {
    can_execute(goal: CognitiveItem): boolean {
        // Check if this executor can handle the goal
        if (goal.type !== 'GOAL') return false;
        
        const label = goal.label || '';
        
        // Simple pattern matching for web search goals
        return label.toLowerCase().includes('search') || 
               label.toLowerCase().includes('find') || 
               label.toLowerCase().includes('lookup');
    }

    async execute(goal: CognitiveItem): Promise<CognitiveItem> {
        // Execute a web search
        // In a real implementation, this would actually perform the search
        console.log(`Executing web search for goal: ${goal.label || goal.id}`);
        
        // Simulate search result
        const resultContent = `Search results for "${goal.label || goal.id}" - Chocolate is indeed toxic to cats, just as it is to dogs. The toxicity is due to theobromine, which cats cannot metabolize effectively.`;
        
        // Create a belief from the search result
        const result = CognitiveItemFactory.createBelief(
            `search-result-${goal.id}`,
            {
                frequency: 1.0,
                confidence: 0.95
            },
            {
                priority: 0.9,
                durability: 0.8
            },
            goal.id
        );
        result.label = resultContent;
        
        return result;
    }
}

export class DiagnosticExecutor implements Executor {
    can_execute(goal: CognitiveItem): boolean {
        // Check if this executor can handle diagnostic goals
        if (goal.type !== 'GOAL') return false;
        
        const label = goal.label || '';
        return label.toLowerCase().includes('diagnose') || 
               label.toLowerCase().includes('diagnostic');
    }

    async execute(goal: CognitiveItem): Promise<CognitiveItem> {
        // Execute a diagnostic process
        console.log(`Executing diagnostic for goal: ${goal.label || goal.id}`);
        
        // Simulate diagnostic result
        const resultContent = `Diagnostic analysis complete. Based on symptoms and known facts, the most likely cause of illness is chocolate poisoning. Immediate veterinary attention is recommended.`;
        
        // Create a belief from the diagnostic result
        const result = CognitiveItemFactory.createBelief(
            `diagnostic-result-${goal.id}`,
            {
                frequency: 0.9,
                confidence: 0.85
            },
            {
                priority: 0.95,
                durability: 0.9
            },
            goal.id
        );
        result.label = resultContent;
        
        return result;
    }
}

export class KnowledgeBaseQueryExecutor implements Executor {
    can_execute(goal: CognitiveItem): boolean {
        // Check if this executor can handle knowledge base queries
        if (goal.type !== 'GOAL') return false;
        
        const label = goal.label || '';
        return label.toLowerCase().includes('query') || 
               label.toLowerCase().includes('retrieve') ||
               label.toLowerCase().includes('get');
    }

    async execute(goal: CognitiveItem): Promise<CognitiveItem> {
        // Execute a knowledge base query
        console.log(`Executing knowledge base query for goal: ${goal.label || goal.id}`);
        
        // Simulate query result
        const resultContent = `Knowledge base query result for "${goal.label || goal.id}" - Found 12 relevant facts about pet nutrition and toxicity.`;
        
        // Create a belief from the query result
        const result = CognitiveItemFactory.createBelief(
            `kb-query-result-${goal.id}`,
            {
                frequency: 1.0,
                confidence: 0.9
            },
            {
                priority: 0.8,
                durability: 0.85
            },
            goal.id
        );
        result.label = resultContent;
        
        return result;
    }
}

export class PlanningExecutor implements Executor {
    can_execute(goal: CognitiveItem): boolean {
        // Check if this executor can handle planning goals
        if (goal.type !== 'GOAL') return false;
        
        const label = goal.label || '';
        return label.toLowerCase().includes('plan') || 
               label.toLowerCase().includes('schedule') ||
               label.toLowerCase().includes('organize');
    }

    async execute(goal: CognitiveItem): Promise<CognitiveItem> {
        // Execute a planning process
        console.log(`Executing planning for goal: ${goal.label || goal.id}`);
        
        // Simulate planning result
        const resultContent = `Planning complete for "${goal.label || goal.id}". Created action sequence: 1. Assess situation, 2. Gather information, 3. Formulate solution, 4. Execute solution.`;
        
        // Create a belief from the planning result
        const result = CognitiveItemFactory.createBelief(
            `planning-result-${goal.id}`,
            {
                frequency: 1.0,
                confidence: 0.8
            },
            {
                priority: 0.85,
                durability: 0.9
            },
            goal.id
        );
        result.label = resultContent;
        
        return result;
    }
}