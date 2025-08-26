import { PriorityAgenda } from './agenda';
import { PersistentWorldModel } from './worldModel';
import { EnhancedWorldModel } from './enhancedWorldModel';
import { SimpleBeliefRevisionEngine } from './beliefRevisionEngine';
import { DynamicAttentionModule } from './attentionModule';
import { EnhancedAttentionModule } from './enhancedAttentionModule';
import { HybridResonanceModule } from './resonanceModule';
import { EfficientSchemaMatcher } from './schemaMatcher';
import { HierarchicalGoalTreeManager } from './goalTreeManager';
import { CognitiveItemFactory } from '../modules/cognitiveItemFactory';
import { ReflectionLoop } from './reflectionLoop';
import { ActionSubsystem } from '../actions/actionSubsystem';
import { SchemaLearningModule } from '../modules/schemaLearningModule';
import { 
  Agenda, 
  WorldModel, 
  BeliefRevisionEngine, 
  AttentionModule, 
  ResonanceModule, 
  SchemaMatcher, 
  GoalTreeManager, 
  CognitiveItem, 
  TruthValue, 
  AttentionValue, 
  SemanticAtom,
  CognitiveSchema
} from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

export class DecentralizedCognitiveCore {
    private agenda: Agenda;
    private worldModel: WorldModel;
    private beliefRevisionEngine: BeliefRevisionEngine;
    private attentionModule: AttentionModule;
    private resonanceModule: ResonanceModule;
    private schemaMatcher: SchemaMatcher;
    private goalTreeManager: GoalTreeManager;
    private reflectionLoop: ReflectionLoop;
    private actionSubsystem: ActionSubsystem;
    private schemaLearningModule: SchemaLearningModule;
    private workerCount: number;
    private isRunning: boolean = false;
    private reflectionInterval: NodeJS.Timeout | null = null;
    private workerStatistics: Map<number, { itemsProcessed: number; errors: number }> = new Map();
    private useEnhancedComponents: boolean;

    constructor(workerCount: number = 4, useEnhancedComponents: boolean = false) {
        this.useEnhancedComponents = useEnhancedComponents;
        
        this.agenda = new PriorityAgenda();
        
        // Optionally use enhanced components
        if (useEnhancedComponents) {
            this.worldModel = new EnhancedWorldModel();
            this.attentionModule = new EnhancedAttentionModule();
        } else {
            this.worldModel = new PersistentWorldModel();
            this.attentionModule = new DynamicAttentionModule();
        }
        
        this.beliefRevisionEngine = new SimpleBeliefRevisionEngine();
        this.resonanceModule = new HybridResonanceModule();
        this.schemaMatcher = new EfficientSchemaMatcher();
        this.goalTreeManager = new HierarchicalGoalTreeManager();
        this.reflectionLoop = new ReflectionLoop(this.worldModel, this.agenda);
        this.actionSubsystem = new ActionSubsystem();
        this.schemaLearningModule = new SchemaLearningModule(this.worldModel);
        this.workerCount = workerCount;
        
        // Initialize worker statistics
        for (let i = 0; i < workerCount; i++) {
            this.workerStatistics.set(i, { itemsProcessed: 0, errors: 0 });
        }
    }

    async start(): Promise<void> {
        this.isRunning = true;
        console.log(`Starting cognitive core with ${this.workerCount} workers`);
        
        // Start reflection loop
        this.reflectionInterval = this.reflectionLoop.start();
        
        // Start worker pool
        const workers = Array(this.workerCount).fill(null).map((_, i) => this.createWorker(i));
        await Promise.all(workers);
    }

    stop(): void {
        this.isRunning = false;
        if (this.reflectionInterval) {
            clearInterval(this.reflectionInterval);
        }
        console.log("Cognitive core stopped");
        this.printWorkerStatistics();
    }

    private async createWorker(workerId: number): Promise<void> {
        console.log(`Worker ${workerId} started`);
        let itemCounter = 0;
        const decayCycleInterval = 100; // Run decay cycle every 100 items
        
        while (this.isRunning) {
            try {
                const itemA = await this.agenda.pop();
                await this.processItem(itemA, workerId);
                
                // Run attention decay cycle periodically
                itemCounter++;
                if (itemCounter % decayCycleInterval === 0) {
                    this.attentionModule.run_decay_cycle(this.worldModel, this.agenda);
                }
            } catch (error) {
                console.error(`Worker ${workerId} encountered an error:`, error);
                const stats = this.workerStatistics.get(workerId) || { itemsProcessed: 0, errors: 0 };
                stats.errors++;
                this.workerStatistics.set(workerId, stats);
            }
        }
        console.log(`Worker ${workerId} stopped`);
    }

    private async processItem(itemA: CognitiveItem, workerId: number): Promise<void> {
        // Update worker statistics
        const stats = this.workerStatistics.get(workerId) || { itemsProcessed: 0, errors: 0 };
        stats.itemsProcessed++;
        this.workerStatistics.set(workerId, stats);
        
        try {
            // Contextualize: Find relevant context via hybrid retrieval
            const contextItems = this.resonanceModule.find_context(itemA, this.worldModel, 10);

            // Reason: Apply applicable schemas to generate new items
            let derivedCount = 0;
            for (const itemB of contextItems) {
                const schemas = this.schemaMatcher.find_applicable(itemA, itemB, this.worldModel);
                for (const schema of schemas) {
                    try {
                        // Record schema usage for reflection
                        this.reflectionLoop.recordSchemaUsage(schema.atom_id);
                        
                        // Apply schema to generate new items
                        const derived = schema.apply(itemA, itemB, this.worldModel);
                        derivedCount += derived.length;
                        
                        for (const newItem of derived) {
                            // Calculate attention for derived items
                            const schemaAtom = this.worldModel.get_atom(schema.atom_id);
                            const sourceTrust = schemaAtom?.meta.trust_score || 0.5;
                            
                            newItem.attention = this.attentionModule.calculate_derived(
                                [itemA, itemB],
                                schema,
                                sourceTrust
                            );
                            
                            // Create derivation stamp
                            newItem.stamp = {
                                timestamp: Date.now(),
                                parent_ids: [itemA.id, itemB.id],
                                schema_id: schema.atom_id
                            };
                            
                            // Add derived item to agenda
                            this.agenda.push(newItem);
                        }
                        
                        // Record successful schema usage for learning
                        this.schemaLearningModule.recordSchemaUsage(schema.atom_id, true, [itemA, itemB]);
                    } catch (error) {
                        console.warn(`Schema ${schema.atom_id} failed:`, error);
                        // Record failed schema usage for learning
                        this.schemaLearningModule.recordSchemaUsage(schema.atom_id, false, [itemA, itemB]);
                    }
                }
            }

            // Memorize: Revise beliefs in world model
            if (itemA.type === "BELIEF") {
                const revised = this.worldModel.revise_belief(itemA);
                if (revised) {
                    this.agenda.push(revised);
                }
            }

            // Reinforce: Update attention based on access
            this.attentionModule.update_on_access([itemA, ...contextItems]);

            // Update goal tree and handle action goals
            if (itemA.type === "GOAL" && itemA.goal_status === "active") {
                // Check if this is an action goal
                if (this.isActionGoal(itemA)) {
                    // Execute the action goal
                    const result = await this.actionSubsystem.executeGoal(itemA);
                    if (result) {
                        // Add the result back to the agenda
                        this.agenda.push(result);
                        // Mark the goal as achieved
                        itemA.goal_status = "achieved";
                        this.goalTreeManager.mark_achieved(itemA.id);
                    }
                } else {
                    // Check if goal is achieved
                    if (this.isGoalAchieved(itemA)) {
                        itemA.goal_status = "achieved";
                        this.goalTreeManager.mark_achieved(itemA.id);
                    } else {
                        // Decompose complex goals into subgoals
                        const subgoals = this.goalTreeManager.decompose(itemA);
                        for (const subgoal of subgoals) {
                            this.agenda.push(subgoal);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Worker failed processing item", itemA.id, error);
            throw error;
        }
    }

    private isActionGoal(goal: CognitiveItem): boolean {
        // Determine if a goal is an action goal based on its content
        const label = goal.label || '';
        return label.toLowerCase().includes('search') || 
               label.toLowerCase().includes('find') || 
               label.toLowerCase().includes('lookup') ||
               label.toLowerCase().includes('diagnose') ||
               label.toLowerCase().includes('diagnostic') ||
               label.toLowerCase().includes('execute') ||
               label.toLowerCase().includes('run');
    }

    private isGoalAchieved(goal: CognitiveItem): boolean {
        // Check if a goal is achieved (simplified implementation)
        // In a real implementation, this would check if the goal's conditions are met
        // For now, we'll use a simple heuristic based on goal content
        const label = goal.label || '';
        if (label.includes('?')) {
            // Query goals are achieved when they get answers
            return false;
        }
        
        // For other goals, use a probability-based approach
        return Math.random() > 0.8; // 20% chance of being achieved
    }

    // Public methods for external interaction
    public addInitialBelief(content: any, truth: TruthValue, attention: AttentionValue, meta?: Record<string, any>): void {
        const atom: SemanticAtom = {
            id: uuidv4(),
            content: content,
            embedding: this.generateEmbedding(content),
            meta: {
                type: "Fact",
                source: "user_input",
                timestamp: new Date().toISOString(),
                trust_score: truth.confidence,
                ...meta
            }
        };
        
        this.worldModel.add_atom(atom);
        const belief = CognitiveItemFactory.createBelief(atom.id, truth, attention);
        this.agenda.push(belief);
    }

    public addInitialGoal(content: any, attention: AttentionValue, meta?: Record<string, any>): void {
        const atom: SemanticAtom = {
            id: uuidv4(),
            content: content,
            embedding: this.generateEmbedding(content),
            meta: {
                type: "Fact",
                source: "user_input",
                timestamp: new Date().toISOString(),
                trust_score: attention.priority,
                ...meta
            }
        };
        
        this.worldModel.add_atom(atom);
        const goal = CognitiveItemFactory.createGoal(atom.id, attention);
        this.agenda.push(goal);
    }

    public addSchema(content: any, meta?: Record<string, any>): void {
        const atom: SemanticAtom = {
            id: uuidv4(),
            content: content,
            embedding: this.generateEmbedding(content),
            meta: {
                type: "CognitiveSchema",
                source: "system",
                timestamp: new Date().toISOString(),
                trust_score: 0.9,
                ...meta
            }
        };
        
        this.worldModel.add_atom(atom);
        this.schemaMatcher.register_schema(atom, this.worldModel);
    }
    
    // System monitoring methods
    public getSystemStatus(): {
        agendaSize: number;
        worldModelStats: any;
        workerStats: Map<number, { itemsProcessed: number; errors: number }>;
    } {
        return {
            agendaSize: this.agenda.size(),
            worldModelStats: (this.worldModel as PersistentWorldModel).getStatistics(),
            workerStats: new Map(this.workerStatistics)
        };
    }
    
    private printWorkerStatistics(): void {
        console.log("Worker Statistics:");
        for (const [workerId, stats] of this.workerStatistics.entries()) {
            console.log(`  Worker ${workerId}: ${stats.itemsProcessed} items processed, ${stats.errors} errors`);
        }
    }

    private generateEmbedding(content: any): number[] {
        // Generate placeholder embeddings
        // In a real implementation, this would use a neural network
        return Array(768).fill(0).map(() => Math.random());
    }
}