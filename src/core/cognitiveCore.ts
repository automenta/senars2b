import {PersistentWorldModel, CognitiveSchema, WorldModel} from './worldModel';
import {BeliefRevisionEngine} from './beliefRevisionEngine';
import {AttentionModule} from './attentionModule';
import {ResonanceModule} from './resonanceModule';
import {SchemaMatcher} from './schemaMatcher';
import {GoalTreeManager} from './goalTreeManager';
import {CognitiveItemFactory} from '../modules/cognitiveItemFactory';
import {ReflectionLoop} from './reflectionLoop';
import {ActionSubsystem} from '../actions/actionSubsystem';
import {SchemaLearningModule} from '../modules/schemaLearningModule';
import {HistoryAnalysisSchema, HistoryRecordingSchema} from '../modules/systemSchemas';
import {DecompositionSchema} from '../modules/decompositionSchema';
import {
    AttentionValue,
    CognitiveItem,
    SemanticAtom,
    TruthValue
} from '../interfaces/types';
import {Agenda} from './agenda';
import {v4 as uuidv4} from 'uuid';
import {embeddingService} from '../services/embeddingService';
import { TaskManager } from '../modules/taskManager';
import { TaskOrchestrator } from '../modules/taskOrchestrator';
import { AddBeliefSchema, AddGoalSchema, AddSchemaSchema } from '../utils/validators';
import {
    GOAL_ACHIEVED_PROBABILITY,
    GOAL_ACHIEVED_THRESHOLD,
    SYSTEM_VERSION
} from '../utils/constants';

export interface CognitiveCoreConfig {
    workerCount?: number;
    decayCycleInterval?: number;
}

const DEFAULT_CONFIG: Required<CognitiveCoreConfig> = {
    workerCount: 4,
    decayCycleInterval: 100,
};

/**
 * DecentralizedCognitiveCore - The main cognitive processing engine
 * Implements a hybrid symbolic and semantic reasoning system with attention dynamics
 */
export interface CognitiveCoreDependencies {
    agenda: Agenda;
    worldModel: WorldModel;
    taskManager: TaskManager;
    taskOrchestrator: TaskOrchestrator;
    beliefRevisionEngine: BeliefRevisionEngine;
    attentionModule: AttentionModule;
    resonanceModule: ResonanceModule;
    schemaMatcher: SchemaMatcher;
    goalTreeManager: GoalTreeManager;
    reflectionLoop: ReflectionLoop;
    actionSubsystem: ActionSubsystem;
    schemaLearningModule: SchemaLearningModule;
}

export class DecentralizedCognitiveCore {
    private readonly agenda: Agenda;
    private readonly worldModel: WorldModel;
    private readonly taskManager: TaskManager;
    private readonly taskOrchestrator: TaskOrchestrator;
    private readonly beliefRevisionEngine: BeliefRevisionEngine;
    private readonly attentionModule: AttentionModule;
    private readonly resonanceModule: ResonanceModule;
    private readonly schemaMatcher: SchemaMatcher;
    private readonly goalTreeManager: GoalTreeManager;
    private readonly reflectionLoop: ReflectionLoop;
    private readonly actionSubsystem: ActionSubsystem;
    private readonly schemaLearningModule: SchemaLearningModule;
    private readonly config: Required<CognitiveCoreConfig>;
    private isRunning: boolean = false;
    private reflectionInterval: NodeJS.Timeout | null = null;
    private workerStatistics: Map<number, {
        itemsProcessed: number;
        errors: number;
        totalProcessingTime: number
    }> = new Map();
    private eventHandler?: (event: CognitiveItem) => void;
    private startTime: number = 0;

    /**
     * Create a new cognitive core
     * @param dependencies The components the core will use
     * @param config Optional configuration for the cognitive core
     */
    constructor(dependencies: CognitiveCoreDependencies, config: CognitiveCoreConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Assign dependencies
        this.agenda = dependencies.agenda;
        this.worldModel = dependencies.worldModel;
        this.taskManager = dependencies.taskManager;
        this.taskOrchestrator = dependencies.taskOrchestrator;
        this.beliefRevisionEngine = dependencies.beliefRevisionEngine;
        this.attentionModule = dependencies.attentionModule;
        this.resonanceModule = dependencies.resonanceModule;
        this.schemaMatcher = dependencies.schemaMatcher;
        this.goalTreeManager = dependencies.goalTreeManager;
        this.reflectionLoop = dependencies.reflectionLoop;
        this.actionSubsystem = dependencies.actionSubsystem;
        this.schemaLearningModule = dependencies.schemaLearningModule;

        // Initialize worker statistics
        this.initializeWorkerStatistics();

        this.registerSystemSchemas();
    }

    /**
     * Start the cognitive core processing
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.warn("Cognitive core is already running");
            return;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        console.log(`Starting cognitive core with ${this.config.workerCount} workers`);

        // Start reflection loop
        this.reflectionInterval = this.reflectionLoop.start();

        // Start worker pool
        const workers = Array(this.config.workerCount).fill(null).map((_, i) => this.createWorker(i));
        await Promise.all(workers);
    }

    /**
     * Stop the cognitive core processing
     */
    stop(): void {
        if (!this.isRunning) {
            console.warn("Cognitive core is not running");
            return;
        }
        
        this.isRunning = false;
        if (this.reflectionInterval) {
            clearInterval(this.reflectionInterval);
            this.reflectionInterval = null;
        }
        console.log("Cognitive core stopped");
        this.printWorkerStatistics();
    }

    /**
     * Add an initial belief to the cognitive system
     * @param content The content of the belief
     * @param truth The truth value of the belief
     * @param attention The attention value of the belief
     * @param meta Optional metadata for the belief
     * @throws Error if any required parameters are missing or invalid
     */
    public async addInitialBelief(content: any, truth: TruthValue, attention: AttentionValue, meta?: Record<string, any>): Promise<void> {
        // Validate input using Zod schema
        const validationResult = AddBeliefSchema.safeParse({ content, truth, attention, meta });
        if (!validationResult.success) {
            throw new Error(`Invalid belief input: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`);
        }
        const { content: validatedContent } = validationResult.data;

        const atomMeta = {
            type: "Fact",
            source: "user_input",
            timestamp: new Date().toISOString(),
            trust_score: truth.confidence,
            ...meta
        };

        const atom = await this._createAndStoreAtom(validatedContent, atomMeta);
        const belief = CognitiveItemFactory.createBelief(atom.id, truth, attention);
        this.agenda.push(belief);
    }

    /**
     * Add an initial goal to the cognitive system
     * @param content The content of the goal
     * @param attention The attention value of the goal
     * @param meta Optional metadata for the goal
     * @throws Error if any required parameters are missing or invalid
     */
    public async addInitialGoal(content: any, attention: AttentionValue, meta?: Record<string, any>): Promise<void> {
        // Validate input using Zod schema
        const validationResult = AddGoalSchema.safeParse({ content, attention, meta });
        if (!validationResult.success) {
            throw new Error(`Invalid goal input: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`);
        }
        const { content: validatedContent } = validationResult.data;

        const atomMeta = {
            type: "Fact",
            source: "user_input",
            timestamp: new Date().toISOString(),
            trust_score: attention.priority,
            ...meta
        };

        const atom = await this._createAndStoreAtom(validatedContent, atomMeta);
        const goal = CognitiveItemFactory.createGoal(atom.id, attention);
        this.agenda.push(goal);
    }

    /**
     * Add a schema to the cognitive system
     * @param content The content of the schema
     * @param meta Optional metadata for the schema
     * @throws Error if content is missing or invalid
     */
    public async addSchema(content: any, meta?: Record<string, any>): Promise<void> {
        // Validate input using Zod schema
        const validationResult = AddSchemaSchema.safeParse({ content, meta });
        if (!validationResult.success) {
            throw new Error(`Invalid schema input: ${JSON.stringify(validationResult.error.flatten().fieldErrors)}`);
        }
        const { content: validatedContent } = validationResult.data;

        const atomMeta = {
            type: "CognitiveSchema",
            source: "system",
            timestamp: new Date().toISOString(),
            trust_score: 0.9, // Schemas from user are trusted by default
            ...meta
        };

        const atom = await this._createAndStoreAtom(validatedContent, atomMeta);
        this.schemaMatcher.register_schema(atom, this.worldModel);
    }

    private async _createAndStoreAtom(content: string, meta: Record<string, any>): Promise<SemanticAtom> {
        const atom: SemanticAtom = {
            id: uuidv4(),
            content: content,
            embedding: await this.generateEmbedding(content),
            creationTime: Date.now(),
            lastAccessTime: Date.now(),
            meta: meta
        };
        this.worldModel.add_atom(atom);
        return atom;
    }

    /**
     * Get the current system status
     * @returns Object containing system status information
     */
    public getSystemStatus(): {
        agendaSize: number;
        worldModelStats: any;
        workerStats: any;
        taskStats: any;
        performance: any;
        systemInfo: any;
    } {
        return {
            agendaSize: this.agenda.size(),
            worldModelStats: (this.worldModel as PersistentWorldModel).getStatistics(),
            workerStats: Object.fromEntries(this.workerStatistics),
            taskStats: this.taskManager.getTaskStatistics(),
            performance: this._getPerformanceStats(),
            systemInfo: {
                workerCount: this.config.workerCount,
                version: SYSTEM_VERSION,
                startTime: this.startTime,
                platform: process.platform,
                arch: process.arch
            }
        };
    }

    private _getPerformanceStats() {
        const totalItems = Array.from(this.workerStatistics.values()).reduce((acc, stats) => acc + stats.itemsProcessed, 0);
        const totalTime = Array.from(this.workerStatistics.values()).reduce((acc, stats) => acc + stats.totalProcessingTime, 0);
        const averageItemProcessingTime = totalItems > 0 ? totalTime / totalItems : 0;

        const uptimeSeconds = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
        const itemsProcessedPerSecond = uptimeSeconds > 0 ? totalItems / uptimeSeconds : 0;

        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);
        const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const activeWorkers = Array.from(this.workerStatistics.values()).filter(stats => stats.itemsProcessed > 0).length;
        const systemLoad = this.config.workerCount > 0 ? activeWorkers / this.config.workerCount : 0;

        return {
            uptime: uptimeStr,
            totalItemsProcessed: totalItems,
            itemsProcessedPerSecond: parseFloat(itemsProcessedPerSecond.toFixed(2)),
            averageItemProcessingTime: parseFloat(averageItemProcessingTime.toFixed(2)),
            systemLoad: parseFloat(systemLoad.toFixed(2))
        };
    }

    /**
     * Get the world model instance
     * @returns The world model component
     */
    public getWorldModel(): WorldModel {
        return this.worldModel;
    }

    /**
     * Set a handler for internally generated events
     * @param handler The function to call when an event is generated
     */
    public setEventHandler(handler: (event: CognitiveItem) => void): void {
        this.eventHandler = handler;
    }


    /**
     * Register built-in system schemas
     */
    private registerSystemSchemas(): void {
        const historySchemaAtom: SemanticAtom = {
            id: HistoryRecordingSchema.atom_id,
            content: {name: 'HistoryRecordingSchema', apply: HistoryRecordingSchema.apply},
            embedding: [], // System schema, no embedding needed
            creationTime: Date.now(), // Added
            lastAccessTime: Date.now(), // Added
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

        const analysisSchemaAtom: SemanticAtom = {
            id: HistoryAnalysisSchema.atom_id,
            content: {name: 'HistoryAnalysisSchema', apply: HistoryAnalysisSchema.apply},
            embedding: [],
            creationTime: Date.now(), // Added
            lastAccessTime: Date.now(), // Added
            meta: {
                type: "CognitiveSchema",
                source: "system",
                timestamp: new Date().toISOString(),
                trust_score: 1.0,
                domain: "system_internals"
            }
        };
        this.worldModel.add_atom(analysisSchemaAtom);
        this.schemaMatcher.register_schema(analysisSchemaAtom, this.worldModel);

        const decompositionSchemaAtom: SemanticAtom = {
            id: DecompositionSchema.atom_id,
            content: {name: 'DecompositionSchema', apply: DecompositionSchema.apply},
            embedding: [],
            creationTime: Date.now(),
            lastAccessTime: Date.now(),
            meta: {
                type: "CognitiveSchema",
                source: "system",
                timestamp: new Date().toISOString(),
                trust_score: 1.0,
                domain: "system_internals"
            }
        };
        this.worldModel.add_atom(decompositionSchemaAtom);
        this.schemaMatcher.register_schema(decompositionSchemaAtom, this.worldModel);
    }

    /**
     * Initialize worker statistics tracking
     */
    private initializeWorkerStatistics(): void {
        for (let i = 0; i < this.config.workerCount; i++) {
            this.workerStatistics.set(i, {itemsProcessed: 0, errors: 0, totalProcessingTime: 0});
        }
    }

    /**
     * Create a worker thread for processing cognitive items
     * @param workerId The ID of the worker to create
     */
    private async createWorker(workerId: number): Promise<void> {
        console.log(`Worker ${workerId} started`);
        let itemCounter = 0;

        while (this.isRunning) {
            try {
                const itemA = await this.agenda.pop();
                await this.processItem(itemA, workerId);

                // Run attention decay cycle periodically
                if (++itemCounter % this.config.decayCycleInterval === 0) {
                    this.attentionModule.run_decay_cycle(this.worldModel, this.agenda);
                }
            } catch (error) {
                console.error(`Worker ${workerId} encountered an error:`, error);
                const stats = this.workerStatistics.get(workerId) || {
                    itemsProcessed: 0,
                    errors: 0,
                    totalProcessingTime: 0
                };
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
        const startTime = Date.now();

        try {
            // Update worker statistics
            this.updateWorkerStatistics(workerId);

            // Contextualize: Find relevant context via hybrid retrieval
            const contextItems = this.resonanceModule.find_context(itemA, this.worldModel, 10);

            // Reason: Apply applicable schemas to generate new items
            await this.reasonWithSchemas(itemA, contextItems);

            // Memorize: Revise beliefs in world model
            this.memorizeBelief(itemA);

            // Reinforce: Update attention based on access
            this.attentionModule.update_on_access([itemA, ...contextItems]);

            // Process tasks using the new functional orchestrator
            if (itemA.type === 'TASK') {
                const orchestrationResult = this.taskOrchestrator.orchestrate(itemA);
                if (orchestrationResult) {
                    const { updatedTask, newItems } = orchestrationResult;

                    // Persist the updated task state
                    this.taskManager.updateTask(updatedTask.id, updatedTask);

                    // Add the updated task and any new items back to the agenda for immediate processing
                    this.agenda.push(updatedTask);
                    for (const newItem of newItems) {
                        this.agenda.push(newItem);
                    }
                }
            }
        } catch (error) {
            console.error("Worker failed processing item", itemA.id, error);
            throw error;
        } finally {
            const duration = Date.now() - startTime;
            const stats = this.workerStatistics.get(workerId)!;
            stats.totalProcessingTime += duration;
        }
    }

    /**
     * Update worker statistics for an item processing operation
     * @param workerId The ID of the worker to update statistics for
     */
    private updateWorkerStatistics(workerId: number): void {
        const stats = this.workerStatistics.get(workerId) || {itemsProcessed: 0, errors: 0, totalProcessingTime: 0};
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
                if (this.eventHandler) {
                    this.eventHandler(event);
                }
            }
        }
    }


    /**
     * Process a task item through its lifecycle
     * @param item The cognitive item to process as a task
     */

    /**
     * Print worker statistics to the console
     */
    private printWorkerStatistics(): void {
        console.log("Worker Statistics:");
        for (const [workerId, stats] of this.workerStatistics.entries()) {
            console.log(`  Worker ${workerId}: ${stats.itemsProcessed} items processed, ${stats.errors} errors`);
        };
    }

    /**
     * Generate a placeholder embedding for content
     * @param content The content to generate an embedding for
     * @returns A placeholder embedding array
     */
    private async generateEmbedding(content: any): Promise<number[]> {
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        // In a real implementation, this would use a neural network
        return embeddingService.generateEmbedding(text);
    }
}
