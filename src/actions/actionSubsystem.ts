import {CognitiveItem} from '../interfaces/types';
import {
    AtomicTaskExecutor,
    DiagnosticExecutor,
    KnowledgeBaseQueryExecutor,
    PlanningExecutor,
    WebSearchExecutor
} from './action';
import {CognitiveItemFactory} from '../modules/cognitiveItemFactory';
import {TaskManager} from '../modules/taskManager';

export interface Executor {
    can_execute(goal: CognitiveItem): boolean;

    execute(goal: CognitiveItem): Promise<CognitiveItem>;
}

export class ActionSubsystem {
    private executors: Executor[] = [];
    private executionHistory: {
        timestamp: number;
        goalId: string;
        executorType: string;
        success: boolean;
        duration: number
    }[] = [];

    constructor(taskManager: TaskManager) {
        // Register default executors
        this.executors.push(new WebSearchExecutor());
        this.executors.push(new DiagnosticExecutor());
        this.executors.push(new KnowledgeBaseQueryExecutor());
        this.executors.push(new PlanningExecutor());
        this.executors.push(new AtomicTaskExecutor(taskManager));
    }

    addExecutor(executor: Executor): void {
        this.executors.push(executor);
    }

    async executeGoal(goal: CognitiveItem): Promise<CognitiveItem | null> {
        // Find an executor that can handle this goal
        const executor = this.executors.find(e => e.can_execute(goal));

        if (executor) {
            const startTime = Date.now();
            let success = false;

            try {
                const result = await executor.execute(goal);
                success = true;

                // Record successful execution
                this.recordExecution(goal.id, executor.constructor.name, true, Date.now() - startTime);

                return result;
            } catch (error) {
                console.error(`Executor failed for goal ${goal.id}:`, error);

                // Record failed execution
                this.recordExecution(goal.id, executor.constructor.name, false, Date.now() - startTime);

                // Create a failure belief
                return this.createFailureBelief(goal, error);
            }
        }

        // No executor found - create a failure belief
        return this.createNoExecutorBelief(goal);
    }

    // Get execution statistics
    getStatistics(): {
        totalExecutions: number;
        successRate: number;
        averageDuration: number;
        executorStats: { [executorType: string]: { count: number; successRate: number } };
    } {
        if (this.executionHistory.length === 0) {
            return {totalExecutions: 0, successRate: 0, averageDuration: 0, executorStats: {}};
        }

        const total = this.executionHistory.length;
        const successes = this.executionHistory.filter(e => e.success).length;
        const successRate = successes / total;

        const totalDuration = this.executionHistory.reduce((sum, e) => sum + e.duration, 0);
        const averageDuration = totalDuration / total;

        // Calculate per-executor statistics
        const executorStats: { [executorType: string]: { count: number; successRate: number } } = {};
        const executorGroups = this.groupBy(this.executionHistory, 'executorType');

        for (const [executorType, executions] of Object.entries(executorGroups)) {
            const count = executions.length;
            const executorSuccesses = executions.filter((e: any) => e.success).length;
            const executorSuccessRate = executorSuccesses / count;

            executorStats[executorType] = {count, successRate: executorSuccessRate};
        }

        return {totalExecutions: total, successRate, averageDuration, executorStats};
    }

    private recordExecution(goalId: string, executorType: string, success: boolean, duration: number): void {
        this.executionHistory.push({
            timestamp: Date.now(),
            goalId,
            executorType,
            success,
            duration
        });

        // Keep only recent history
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-1000);
        }
    }

    private createFailureBelief(goal: CognitiveItem, error: any): CognitiveItem {
        const failureBelief = CognitiveItemFactory.createBelief(
            `action-failure-${goal.id}`,
            {frequency: 0.0, confidence: 0.9}, // Low frequency (failed), high confidence
            {priority: 0.8, durability: 0.7}
        );
        failureBelief.label = `Action execution failed for goal "${goal.label || goal.id}": ${error.message || 'Unknown error'}`;

        return failureBelief;
    }

    private createNoExecutorBelief(goal: CognitiveItem): CognitiveItem {
        const noExecutorBelief = CognitiveItemFactory.createBelief(
            `no-executor-${goal.id}`,
            {frequency: 0.0, confidence: 0.8}, // Low frequency (failed), medium confidence
            {priority: 0.6, durability: 0.5}
        );
        noExecutorBelief.label = `No executor found for goal "${goal.label || goal.id}"`;

        return noExecutorBelief;
    }

    private groupBy<T>(array: T[], key: string): { [key: string]: T[] } {
        return array.reduce((result, item) => {
            const groupKey = (item as any)[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {} as { [key: string]: T[] });
    }
}
