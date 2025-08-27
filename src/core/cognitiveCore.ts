import { PriorityAgenda } from './agenda';
import { PersistentWorldModel } from './worldModel';
import { SimpleBeliefRevisionEngine } from './beliefRevisionEngine';
import { DynamicAttentionModule } from './attentionModule';
import { HybridResonanceModule } from './resonanceModule';
import { EfficientSchemaMatcher } from './schemaMatcher';
import { HierarchicalGoalTreeManager } from './goalTreeManager';
import { CognitiveItemFactory } from '../modules/cognitiveItemFactory';
import { ReflectionLoop } from './reflectionLoop';
import { ActionSubsystem } from '../actions/actionSubsystem';
import { SchemaLearningModule } from '../modules/schemaLearningModule';
import { HistoryRecordingSchema } from '../modules/systemSchemas';
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

/**
 * DecentralizedCognitiveCore - The main cognitive processing engine
 * Implements a hybrid symbolic and semantic reasoning system with attention dynamics
 */
export class DecentralizedCognitiveCore {
    private agenda: Agenda;
    private worldModel!: WorldModel;
    private beliefRevisionEngine!: BeliefRevisionEngine;
    private attentionModule!: AttentionModule;
    private resonanceModule!: ResonanceModule;
    private schemaMatcher!: SchemaMatcher;
    private goalTreeManager!: GoalTreeManager;
    private reflectionLoop!: ReflectionLoop;
    private actionSubsystem!: ActionSubsystem;
    private schemaLearningModule!: SchemaLearningModule;
    private workerCount: number;
    private isRunning: boolean = false;
    private reflectionInterval: NodeJS.Timeout | null = null;
    private workerStatistics: Map<number, { itemsProcessed: number; errors: number }> = new Map();

    /**
     * Create a new cognitive core
     * @param workerCount Number of worker threads to use for processing
     */
    constructor(workerCount: number = 4) {
        this.agenda = new PriorityAgenda();
        
        // Initialize components
        this.initializeComponents();
        
        this.workerCount = workerCount;
        
        // Initialize worker statistics
        this.initializeWorkerStatistics();
    }

    /**
     * Initialize all cognitive components
     */
    private initializeComponents(): void {
        // Use standard components only
        this.worldModel = new PersistentWorldModel();
        this.attentionModule = new DynamicAttentionModule();
        
        this.beliefRevisionEngine = new SimpleBeliefRevisionEngine();
        this.resonanceModule = new HybridResonanceModule();
        this.schemaMatcher = new EfficientSchemaMatcher();
        this.goalTreeManager = new HierarchicalGoalTreeManager();
        this.reflectionLoop = new ReflectionLoop(this.worldModel, this.agenda);
        this.actionSubsystem = new ActionSubsystem();
        this.schemaLearningModule = new SchemaLearningModule(this.worldModel);

        this.registerSystemSchemas();
    }

    /**
     * Register built-in system schemas
     */
    private registerSystemSchemas(): void {
        const historySchemaAtom: SemanticAtom = {
            id: HistoryRecordingSchema.atom_id,
            content: { name: 'HistoryRecordingSchema', apply: HistoryRecordingSchema.apply },
            embedding: [], // System schema, no embedding needed
            meta: {
                type: "CognitiveSchema",
                source: "system",
                timestamp: new Date().toISOString(),
                trust_score: 1.0,
                domain: "system_internals"
            }
        };
        this.worldModel.add_atom(historySchemaAtom);
        this.schemaMatcher.register_schema(historySchemaAtom, this.worldModel);
    }

    /**
     * Initialize worker statistics tracking
     */
    private initializeWorkerStatistics(): void {
        for (let i = 0; i < this.workerCount; i++) {
            this.workerStatistics.set(i, { itemsProcessed: 0, errors: 0 });
        }
    }

    /**
     * Start the cognitive core processing
     */
    async start(): Promise<void> {
        this.isRunning = true;
        console.log(`Starting cognitive core with ${this.workerCount} workers`);
        
        // Start reflection loop
        this.reflectionInterval = this.reflectionLoop.start();
        
        // Start worker pool
        const workers = Array(this.workerCount).fill(null).map((_, i) => this.createWorker(i));
        await Promise.all(workers);
    }

    /**
     * Stop the cognitive core processing
     */
    stop(): void {
        this.isRunning = false;
        if (this.reflectionInterval) {
            clearInterval(this.reflectionInterval);
        }
        console.log("Cognitive core stopped");
        this.printWorkerStatistics();
    }

    /**
     * Create a worker thread for processing cognitive items
     * @param workerId The ID of the worker to create
     */
    private async createWorker(workerId: number): Promise<void> {
        console.log(`Worker ${workerId} started`);
        let itemCounter = 0;
        const decayCycleInterval = 100; // Run decay cycle every 100 items
        
        while (this.isRunning) {
            try {
                const itemA = await this.agenda.pop();
                await this.processItem(itemA, workerId);
                
                // Run attention decay cycle periodically
                if (++itemCounter % decayCycleInterval === 0) {
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

    /**
     * Process a cognitive item through the cognitive cycle
     * @param itemA The cognitive item to process
     * @param workerId The ID of the worker processing the item
     */
    private async processItem(itemA: CognitiveItem, workerId: number): Promise<void> {
        // Update worker statistics
        this.updateWorkerStatistics(workerId);
        
        try {
            // Contextualize: Find relevant context via hybrid retrieval
            const contextItems = this.resonanceModule.find_context(itemA, this.worldModel, 10);

            // Reason: Apply applicable schemas to generate new items
            await this.reasonWithSchemas(itemA, contextItems);

            // Memorize: Revise beliefs in world model
            this.memorizeBelief(itemA);

            // Reinforce: Update attention based on access
            this.attentionModule.update_on_access([itemA, ...contextItems]);

            // Update goal tree and handle action goals
            await this.processGoals(itemA);
        } catch (error) {
            console.error("Worker failed processing item", itemA.id, error);
            throw error;
        }
    }

    /**
     * Update worker statistics for an item processing operation
     * @param workerId The ID of the worker to update statistics for
     */
    private updateWorkerStatistics(workerId: number): void {
        const stats = this.workerStatistics.get(workerId) || { itemsProcessed: 0, errors: 0 };
        stats.itemsProcessed++;
        this.workerStatistics.set(workerId, stats);
    }

    /**
     * Apply reasoning schemas to generate new cognitive items
     * @param itemA The first cognitive item
     * @param contextItems Contextual items to use in reasoning
     */
    private async reasonWithSchemas(itemA: CognitiveItem, contextItems: CognitiveItem[]): Promise<void> {
        for (const itemB of contextItems) {
            const schemas = this.schemaMatcher.find_applicable(itemA, itemB, this.worldModel);
            for (const schema of schemas) {
                await this.applySchema(itemA, itemB, schema);
            }
        }
    }

    /**
     * Apply a schema to two cognitive items to generate new items
     * @param itemA The first cognitive item
     * @param itemB The second cognitive item
     * @param schema The schema to apply
     */
    private async applySchema(itemA: CognitiveItem, itemB: CognitiveItem, schema: CognitiveSchema): Promise<void> {
        try {
            // Record schema usage for reflection
            this.reflectionLoop.recordSchemaUsage(schema.atom_id);
            
            // Apply schema to generate new items
            const derived = schema.apply(itemA, itemB, this.worldModel);
            
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

    /**
     * Revise beliefs in the world model if the item is a belief
     * @param itemA The cognitive item to potentially revise
     */
    private memorizeBelief(itemA: CognitiveItem): void {
        if (itemA.type === "BELIEF") {
            const [revised, event] = this.worldModel.revise_belief(itemA);
            if (revised) {
                // The revised item is already in the world model, but we might want to
                // push it to the agenda to trigger further reasoning with the new truth value.
                // The original code did this, so we'll keep it.
                this.agenda.push(revised);
            }
            if (event) {
                this.agenda.push(event);
            }
        }
    }

    /**
     * Process goals in the cognitive item
     * @param itemA The cognitive item to process as a goal
     */
    private async processGoals(itemA: CognitiveItem): Promise<void> {
        if (itemA.type === "GOAL" && itemA.goal_status === "active") {
            // Check if this is an action goal
            if (this.isActionGoal(itemA)) {
                await this.executeActionGoal(itemA);
            } else {
                await this.processCognitiveGoal(itemA);
            }
        }
    }

    /**
     * Execute an action goal using the action subsystem
     * @param goal The action goal to execute
     */
    private async executeActionGoal(goal: CognitiveItem): Promise<void> {
        // Execute the action goal
        const result = await this.actionSubsystem.executeGoal(goal);
        if (result) {
            // Add the result back to the agenda
            this.agenda.push(result);
            // Mark the goal as achieved
            goal.goal_status = "achieved";
            this.goalTreeManager.mark_achieved(goal.id);
        }
    }

    /**
     * Process a cognitive goal (non-action)
     * @param goal The cognitive goal to process
     */
    private async processCognitiveGoal(goal: CognitiveItem): Promise<void> {
        // Check if goal is achieved
        if (this.isGoalAchieved(goal)) {
            goal.goal_status = "achieved";
            this.goalTreeManager.mark_achieved(goal.id);
        } else {
            // Decompose complex goals into subgoals
            const subgoals = this.goalTreeManager.decompose(goal);
            for (const subgoal of subgoals) {
                this.agenda.push(subgoal);
            }
        }
    }

    /**
     * Determine if a goal is an action goal based on its content
     * @param goal The goal to check
     * @returns True if the goal is an action goal, false otherwise
     */
    private isActionGoal(goal: CognitiveItem): boolean {
        const actionKeywords = ['search', 'find', 'lookup', 'diagnose', 'diagnostic', 'execute', 'run'];
        const label = (goal.label || '').toLowerCase();
        return actionKeywords.some(keyword => label.includes(keyword));
    }

    /**
     * Check if a goal is achieved (simplified implementation)
     * @param goal The goal to check
     * @returns True if the goal is achieved, false otherwise
     */
    private isGoalAchieved(goal: CognitiveItem): boolean {
        // Query goals are achieved when they get answers
        if ((goal.label || '').includes('?')) return false;
        
        // For other goals, use a probability-based approach
        return Math.random() > 0.8; // 20% chance of being achieved
    }

    /**
     * Add an initial belief to the cognitive system
     * @param content The content of the belief
     * @param truth The truth value of the belief
     * @param attention The attention value of the belief
     * @param meta Optional metadata for the belief
     */
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

    /**
     * Add an initial goal to the cognitive system
     * @param content The content of the goal
     * @param attention The attention value of the goal
     * @param meta Optional metadata for the goal
     */
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

    /**
     * Add a schema to the cognitive system
     * @param content The content of the schema
     * @param meta Optional metadata for the schema
     */
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
    
    /**
     * Get the current system status
     * @returns Object containing system status information
     */
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
    
    /**
     * Print worker statistics to the console
     */
    private printWorkerStatistics(): void {
        console.log("Worker Statistics:");
        for (const [workerId, stats] of this.workerStatistics.entries()) {
            console.log(`  Worker ${workerId}: ${stats.itemsProcessed} items processed, ${stats.errors} errors`);
        }
    }

    /**
     * Generate a placeholder embedding for content
     * @param content The content to generate an embedding for
     * @returns A placeholder embedding array
     */
    private generateEmbedding(content: any): number[] {
        // Generate placeholder embeddings
        // In a real implementation, this would use a neural network
        return Array(768).fill(0).map(() => Math.random());
    }
}