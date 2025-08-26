import { CognitiveItem, CognitiveSchema, WorldModel, SemanticAtom } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * SchemaLearningModule - Automatically generates new schemas based on successful reasoning patterns
 * 
 * This module implements a key aspect of Non-Axiomatic Logic: the ability to learn and evolve
 * reasoning patterns through experience. It monitors successful schema applications and
 * generalizes them into new schemas.
 */
export class SchemaLearningModule {
    private worldModel: WorldModel;
    private schemaUsageHistory: Map<string, {
        applications: number;
        successes: number;
        lastUsed: number;
        pattern: any;
    }>;
    private learningThreshold: number; // Minimum success rate to create new schema
    private minApplications: number;   // Minimum applications before considering learning

    constructor(worldModel: WorldModel, learningThreshold: number = 0.7, minApplications: number = 5) {
        this.worldModel = worldModel;
        this.schemaUsageHistory = new Map();
        this.learningThreshold = learningThreshold;
        this.minApplications = minApplications;
    }

    /**
     * Record a schema usage for learning purposes
     * @param schemaId The ID of the schema that was used
     * @param success Whether the application was successful
     * @param items The items involved in the application
     */
    recordSchemaUsage(schemaId: string, success: boolean, items: CognitiveItem[]): void {
        if (!this.schemaUsageHistory.has(schemaId)) {
            this.schemaUsageHistory.set(schemaId, {
                applications: 0,
                successes: 0,
                lastUsed: Date.now(),
                pattern: this.extractPattern(items)
            });
        }

        const record = this.schemaUsageHistory.get(schemaId)!;
        record.applications++;
        if (success) {
            record.successes++;
        }
        record.lastUsed = Date.now();
    }

    /**
     * Attempt to learn new schemas from successful patterns
     * @returns Array of newly created schema IDs
     */
    learnNewSchemas(): string[] {
        const newSchemaIds: string[] = [];
        
        // Look for patterns that have been successfully applied multiple times
        for (const [schemaId, record] of this.schemaUsageHistory.entries()) {
            // Check if we have enough applications and a high enough success rate
            if (record.applications >= this.minApplications && 
                (record.successes / record.applications) >= this.learningThreshold) {
                
                // Try to generalize this pattern into a new schema
                const newSchema = this.generalizePattern(schemaId, record.pattern);
                if (newSchema) {
                    // Add the new schema to the world model
                    const atomId = this.worldModel.add_atom(newSchema.atom);
                    const cognitiveSchema = this.worldModel.register_schema_atom(newSchema.atom);
                    newSchemaIds.push(atomId);
                    
                    // Reset the usage history for this pattern to avoid infinite learning
                    record.applications = 0;
                    record.successes = 0;
                }
            }
        }
        
        return newSchemaIds;
    }

    /**
     * Extract a pattern from a set of cognitive items
     * @param items The items to extract a pattern from
     * @returns A pattern representation
     */
    private extractPattern(items: CognitiveItem[]): any {
        // Simple pattern extraction - in a real implementation, this would be more sophisticated
        return {
            types: items.map(item => item.type),
            relationships: this.extractRelationships(items),
            domains: items.map(item => item.label?.toLowerCase().includes('medical') ? 'medical' : 
                                 item.label?.toLowerCase().includes('financial') ? 'financial' : 
                                 item.label?.toLowerCase().includes('legal') ? 'legal' : 'general')
        };
    }

    /**
     * Extract relationships between items
     * @param items The items to analyze
     * @returns Relationship information
     */
    private extractRelationships(items: CognitiveItem[]): any {
        // Simple relationship extraction
        if (items.length >= 2) {
            return {
                itemTypes: [items[0].type, items[1].type],
                goalRelationship: items.some(item => item.type === 'GOAL') && items.some(item => item.type === 'BELIEF')
            };
        }
        return {};
    }

    /**
     * Generalize a pattern into a new schema
     * @param originalSchemaId The ID of the original schema
     * @param pattern The pattern to generalize
     * @returns A new schema or null if generalization fails
     */
    private generalizePattern(originalSchemaId: string, pattern: any): {atom: SemanticAtom} | null {
        try {
            // Create a generalized schema based on the pattern
            const generalizedSchema: CognitiveSchema = {
                atom_id: uuidv4(),
                apply: (a: CognitiveItem, b: CognitiveItem, worldModel: WorldModel) => {
                    // This is a placeholder implementation
                    // In a real system, this would contain the generalized logic
                    return this.applyGeneralizedSchema(a, b, pattern);
                }
            };

            // Create a semantic atom for this schema
            const atom: SemanticAtom = {
                id: generalizedSchema.atom_id,
                content: `Generalized schema based on pattern: ${JSON.stringify(pattern)}`,
                embedding: this.generateEmbedding(pattern),
                meta: {
                    type: "CognitiveSchema",
                    source: "schema_learning",
                    timestamp: new Date().toISOString(),
                    trust_score: 0.8, // Initial trust score for learned schemas
                    original_schema: originalSchemaId,
                    pattern: JSON.stringify(pattern)
                }
            };

            return { atom };
        } catch (error) {
            console.error('Error generalizing pattern:', error);
            return null;
        }
    }

    /**
     * Apply a generalized schema to two cognitive items
     * @param a First cognitive item
     * @param b Second cognitive item
     * @param pattern The pattern this schema is based on
     * @returns Derived cognitive items
     */
    private applyGeneralizedSchema(a: CognitiveItem, b: CognitiveItem, pattern: any): CognitiveItem[] {
        // This is a simplified implementation
        // A real implementation would contain more sophisticated logic
        
        const derivedItems: CognitiveItem[] = [];
        
        // Create a new belief that combines information from both items
        const combinedContent = `Combination of "${a.label}" and "${b.label}" based on learned pattern`;
        
        const newItem: CognitiveItem = {
            id: uuidv4(),
            atom_id: uuidv4(),
            type: 'BELIEF',
            truth: {
                frequency: 0.7, // Moderate frequency for learned conclusions
                confidence: 0.6  // Lower confidence for learned conclusions
            },
            attention: {
                priority: 0.5,
                durability: 0.4
            },
            stamp: {
                timestamp: Date.now(),
                parent_ids: [a.id, b.id],
                schema_id: uuidv4() // This would be the actual schema ID
            },
            label: combinedContent
        };
        
        derivedItems.push(newItem);
        return derivedItems;
    }

    /**
     * Generate an embedding for a pattern
     * @param pattern The pattern to generate an embedding for
     * @returns A placeholder embedding
     */
    private generateEmbedding(pattern: any): number[] {
        // In a real implementation, this would use a neural network
        // For now, we'll generate a placeholder embedding
        return Array(768).fill(0).map(() => Math.random());
    }

    /**
     * Get statistics about the schema learning process
     * @returns Learning statistics
     */
    getStatistics(): any {
        return {
            trackedSchemas: this.schemaUsageHistory.size,
            totalApplications: Array.from(this.schemaUsageHistory.values())
                .reduce((sum, record) => sum + record.applications, 0),
            successfulGeneralizations: Array.from(this.schemaUsageHistory.values())
                .filter(record => record.applications >= this.minApplications && 
                                (record.successes / record.applications) >= this.learningThreshold)
                .length,
            learningThreshold: this.learningThreshold,
            minApplications: this.minApplications
        };
    }

    /**
     * Clear the schema usage history
     */
    clearHistory(): void {
        this.schemaUsageHistory.clear();
    }
}