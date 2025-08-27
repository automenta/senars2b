import {AttentionValue, CognitiveItem, Transducer, TruthValue} from '../interfaces/types';
import {SensorStreamTransducer, TextTransducer} from './perception';
import {CognitiveItemFactory} from './cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';

export class PerceptionSubsystem {
    private transducers: Transducer[] = [];
    private processingHistory: { timestamp: number; inputType: string; itemCount: number }[] = [];

    constructor() {
        // Register default transducers
        this.transducers.push(new TextTransducer());
        this.transducers.push(new SensorStreamTransducer());
    }

    addTransducer(transducer: Transducer): void {
        this.transducers.push(transducer);
    }

    async processInput(data: any): Promise<CognitiveItem[]> {
        const inputType = this.determineInputType(data);
        const startTime = Date.now();

        // Try each transducer
        const allItems = [];
        for (const transducer of this.transducers) {
            try {
                const items = await transducer.process(data);
                allItems.push(...items);
            } catch (error) {
                console.error("Transducer failed:", error);
            }
        }

        // Record processing statistics
        this.processingHistory.push({
            timestamp: startTime,
            inputType,
            itemCount: allItems.length
        });

        // Keep only recent history (limit to 100 records)
        this.processingHistory = this.processingHistory.slice(-100);

        return allItems;
    }

    // Process structured observations
    processObservation(observation: any, source: string = "perception"): CognitiveItem[] {
        const items: CognitiveItem[] = [];
        const truth: TruthValue = {frequency: 1.0, confidence: 0.9};
        const attention: AttentionValue = {priority: 0.7, durability: 0.6};

        const item = CognitiveItemFactory.createBelief(
            `observation-${uuidv4()}`,
            truth,
            attention
        );
        item.label = typeof observation === 'string' ? observation : JSON.stringify(observation);

        // Add metadata
        (item as any).source = source;
        (item as any).observationType = this.determineObservationType(observation);

        items.push(item);
        return items;
    }

    // Process user commands
    processCommand(command: string): CognitiveItem[] {
        const items: CognitiveItem[] = [];
        const attention: AttentionValue = {priority: 0.9, durability: 0.7};

        const item = CognitiveItemFactory.createGoal(
            `command-${uuidv4()}`,
            attention
        );
        item.label = command;

        // Add metadata
        (item as any).source = "user_command";
        (item as any).commandType = this.classifyCommand(command);

        items.push(item);
        return items;
    }

    // Get processing statistics
    getStatistics(): {
        totalProcessed: number;
        averageItemsPerInput: number;
        recentProcessingRate: number; // items per second
    } {
        if (this.processingHistory.length === 0) {
            return {totalProcessed: 0, averageItemsPerInput: 0, recentProcessingRate: 0};
        }

        const totalItems = this.processingHistory.reduce((sum, record) => sum + record.itemCount, 0);
        const averageItems = totalItems / this.processingHistory.length;

        // Calculate recent processing rate (last 10 records)
        const recentRecords = this.processingHistory.slice(-10);
        const timeSpan = Date.now() - (recentRecords[0]?.timestamp || Date.now());
        const recentItems = recentRecords.reduce((sum, record) => sum + record.itemCount, 0);
        const processingRate = timeSpan > 0 ? recentItems / (timeSpan / 1000) : 0; // items per second

        return {
            totalProcessed: this.processingHistory.length,
            averageItemsPerInput: averageItems,
            recentProcessingRate: processingRate
        };
    }

    private determineInputType(data: any): string {
        if (typeof data === 'string') return 'text';
        if (Array.isArray(data)) return 'array';
        if (data && typeof data === 'object') return 'object';
        if (typeof data === 'number') return 'number';
        if (typeof data === 'boolean') return 'boolean';
        return 'unknown';
    }

    private determineObservationType(observation: any): string {
        if (typeof observation === 'string') return 'textual';
        if (typeof observation === 'number') return 'numerical';
        if (Array.isArray(observation)) return 'sequence';
        if (observation && typeof observation === 'object') {
            if (observation.type) return observation.type;
            if (observation.value !== undefined) return 'measurement';
            return 'structured';
        }
        return 'unknown';
    }

    private classifyCommand(command: string): string {
        const cmd = command.toLowerCase();
        const commandTypes: [string[], string][] = [
            [['search', 'find', 'look'], 'search'],
            [['diagnose', 'analyze', 'check'], 'diagnostic'],
            [['create', 'make', 'generate'], 'creation'],
            [['delete', 'remove', 'cancel'], 'deletion'],
            [['update', 'change', 'modify'], 'modification']
        ];

        for (const [keywords, type] of commandTypes) {
            if (keywords.some(keyword => cmd.includes(keyword))) return type;
        }

        return 'general';
    }
}