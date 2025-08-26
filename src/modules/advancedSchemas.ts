import { SemanticAtom, CognitiveSchema, CognitiveItem, WorldModel } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItemFactory } from './cognitiveItemFactory';

// Enhanced Analogy Hypothesis Schema
export const EnhancedAnalogyHypothesisSchema: SemanticAtom = {
    id: "enhanced-analogy-hypothesis-schema",
    content: {
        name: "EnhancedAnalogyHypothesis",
        description: "If A is related to B in a certain way, and C is similar to A, then C might be related to B in a similar way",
        pattern: {
            premise1: "(is_related_to ?A ?B)",
            premise2: "(is_similar ?A ?C)",
            conclusion: "(is_related_to ?C ?B ?confidence)"
        },
        apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
            // Get the atoms for both items
            const atomA = worldModel.get_atom(a.atom_id);
            const atomB = worldModel.get_atom(b.atom_id);
            
            if (!atomA || !atomB) return [];
            
            // Try to extract relationships from the content
            const contentA = typeof atomA.content === 'string' ? atomA.content : JSON.stringify(atomA.content);
            const contentB = typeof atomB.content === 'string' ? atomB.content : JSON.stringify(atomB.content);
            
            // Simple pattern matching for "is_related_to" relationships
            const relationA = contentA.match(/is\s+related\s+to|causes|implies/);
            const relationB = contentB.match(/is\s+related\s+to|causes|implies/);
            
            if (relationA && relationB) {
                // Create a query based on the analogy
                const query = CognitiveItemFactory.createQuery(
                    `analogy-query-${uuidv4()}`,
                    {
                        priority: 0.75,
                        durability: 0.7
                    },
                    a.id
                );
                query.label = `Analogy query: If "${contentA}" and "${contentB}", what other relationships might exist?`;
                
                return [query];
            }
            
            return [];
        }
    },
    embedding: Array(768).fill(0).map(() => Math.random()),
    meta: {
        type: "CognitiveSchema",
        source: "system",
        timestamp: new Date().toISOString(),
        trust_score: 0.85,
        domain: "reasoning"
    }
};

// Enhanced Causal Inference Schema
export const EnhancedCausalInferenceSchema: SemanticAtom = {
    id: "enhanced-causal-inference-schema",
    content: {
        name: "EnhancedCausalInference",
        description: "If A causes B, and B is observed, then A might have occurred",
        pattern: {
            premise1: "(causes ?A ?B)",
            premise2: "(observed ?B)",
            conclusion: "(likely ?A ?confidence)"
        },
        apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
            // Get the atoms for both items
            const atomA = worldModel.get_atom(a.atom_id);
            const atomB = worldModel.get_atom(b.atom_id);
            
            if (!atomA || !atomB) return [];
            
            // Try to extract causal relationships
            const contentA = typeof atomA.content === 'string' ? atomA.content : JSON.stringify(atomA.content);
            const contentB = typeof atomB.content === 'string' ? atomB.content : JSON.stringify(atomB.content);
            
            // Check for causal patterns
            const causesPattern = contentA.match(/causes|leads\s+to|results\s+in/);
            const observedPattern = contentB.match(/observed|seen|noticed|sick|ill/);
            
            if (causesPattern && observedPattern) {
                // Create a belief based on causal inference
                const belief = CognitiveItemFactory.createBelief(
                    `causal-inference-${uuidv4()}`,
                    {
                        frequency: 0.85,
                        confidence: 0.75
                    },
                    {
                        priority: 0.8,
                        durability: 0.75
                    },
                    a.id
                );
                belief.label = `Causal inference: Since "${contentA}" and "${contentB}" was observed, the cause likely occurred`;
                
                return [belief];
            }
            
            return [];
        }
    },
    embedding: Array(768).fill(0).map(() => Math.random()),
    meta: {
        type: "CognitiveSchema",
        source: "system",
        timestamp: new Date().toISOString(),
        trust_score: 0.8,
        domain: "reasoning"
    }
};

// Goal Decomposition Schema
export const GoalDecompositionSchema: SemanticAtom = {
    id: "goal-decomposition-schema",
    content: {
        name: "GoalDecomposition",
        description: "Complex goals can be broken down into simpler subgoals",
        pattern: {
            premise: "(goal ?complex)",
            conclusion: "(subgoals ?complex ?simpler1 ?simpler2 ...)"
        },
        apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel): CognitiveItem[] => {
            // This schema applies to complex goals
            if (a.type === 'GOAL' && b.type === 'GOAL') {
                // Create subgoals for complex goals
                const subgoals: CognitiveItem[] = [];
                
                // Simple heuristic: if the goal content is long, decompose it
                const atomA = worldModel.get_atom(a.atom_id);
                const atomB = worldModel.get_atom(b.atom_id);
                
                if (atomA && atomB) {
                    const contentA = typeof atomA.content === 'string' ? atomA.content : JSON.stringify(atomA.content);
                    const contentB = typeof atomB.content === 'string' ? atomB.content : JSON.stringify(atomB.content);
                    
                    if (contentA.length > 30 || contentB.length > 30) {
                        // Create 2 subgoals
                        for (let i = 0; i < 2; i++) {
                            const subgoal = CognitiveItemFactory.createGoal(
                                `subgoal-${uuidv4()}`,
                                {
                                    priority: 0.7,
                                    durability: 0.6
                                },
                                a.id
                            );
                            subgoal.label = `Subgoal ${i+1} for complex goal`;
                            subgoal.goal_parent_id = a.id;
                            
                            subgoals.push(subgoal);
                        }
                        
                        return subgoals;
                    }
                }
            }
            
            return [];
        }
    },
    embedding: Array(768).fill(0).map(() => Math.random()),
    meta: {
        type: "CognitiveSchema",
        source: "system",
        timestamp: new Date().toISOString(),
        trust_score: 0.9,
        domain: "planning"
    }
};