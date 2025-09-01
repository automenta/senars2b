import { CognitiveItem } from '@/interfaces/types';
import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';
import { UnifiedExecutor } from './UnifiedExecutor';
import { CognitiveItemFactory } from '@/modules/cognitiveItemFactory';
import { TaskManager } from '@/modules/taskManager';

interface ActionSubsystemConfig extends BaseConfig {
  enableStatisticsTracking?: boolean;
  maxExecutionHistory?: number;
  defaultRetryAttempts?: number;
}

interface ActionSubsystemEvents {
  goalExecutionStarted: { goalId: string; executorType: string };
  goalExecutionCompleted: { goalId: string; executorType: string; success: boolean };
  goalExecutionFailed: { goalId: string; executorType: string; error: string };
  executorRegistered: { executorType: string };
}

export class UnifiedActionSubsystem extends UnifiedBaseComponent<ActionSubsystemConfig, ActionSubsystemEvents> {
  private executors: UnifiedExecutor[] = [];
  private executionHistory: {
    timestamp: number;
    goalId: string;
    executorType: string;
    success: boolean;
    duration: number;
    error?: string;
  }[] = [];
  private taskManager: TaskManager;

  constructor(
    taskManager: TaskManager,
    defaultConfig: ActionSubsystemConfig,
    userConfig: Partial<ActionSubsystemConfig> = {}
  ) {
    super('ActionSubsystem', defaultConfig, userConfig);
    this.taskManager = taskManager;
  }

  addExecutor(executor: UnifiedExecutor): void {
    this.executors.push(executor);
    
    // Register event listeners for execution events
    executor.on('executionStarted', (event) => {
      this.notifyEvent('goalExecutionStarted', { 
        goalId: event.goalId, 
        executorType: event.executorType 
      }, {
        component: 'ActionSubsystem',
        operation: 'addExecutor',
        goalId: event.goalId
      });
    });
    
    executor.on('executionCompleted', (event) => {
      this.notifyEvent('goalExecutionCompleted', { 
        goalId: event.goalId, 
        executorType: event.executorType,
        success: event.success
      }, {
        component: 'ActionSubsystem',
        operation: 'addExecutor',
        goalId: event.goalId
      });
    });
    
    executor.on('executionFailed', (event) => {
      this.notifyEvent('goalExecutionFailed', { 
        goalId: event.goalId, 
        executorType: event.executorType,
        error: event.error.message
      }, {
        component: 'ActionSubsystem',
        operation: 'addExecutor',
        goalId: event.goalId
      });
    });
    
    this.notifyEvent('executorRegistered', { 
      executorType: executor.constructor.name 
    }, {
      component: 'ActionSubsystem',
      operation: 'addExecutor',
      executorType: executor.constructor.name
    });
  }

  async executeGoal(goal: CognitiveItem): Promise<CognitiveItem | null> {
    // Find an executor that can handle this goal
    const executor = this.executors.find(e => e.canExecute(goal));

    if (executor) {
      const startTime = Date.now();
      let success = false;
      let error: any = null;

      try {
        const result = await executor.executeWithLogging(goal);
        success = true;
        return result;
      } catch (err) {
        error = err;
        this.getLogger().error({
          error: err, 
          goalId: goal.id, 
          executor: executor.constructor.name
        }, `Executor failed for goal`);
        
        // Create a failure belief
        return this.createFailureBelief(goal, err);
      } finally {
        // Record execution
        this.recordExecution(
          goal.id, 
          executor.constructor.name, 
          success, 
          Date.now() - startTime,
          error ? error.message : undefined
        );
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
      return {
        totalExecutions: 0, 
        successRate: 0, 
        averageDuration: 0, 
        executorStats: {}
      };
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

      executorStats[executorType] = { count, successRate: executorSuccessRate };
    }

    return { totalExecutions: total, successRate, averageDuration, executorStats };
  }

  private recordExecution(
    goalId: string, 
    executorType: string, 
    success: boolean, 
    duration: number,
    error?: string
  ): void {
    this.executionHistory.push({
      timestamp: Date.now(),
      goalId,
      executorType,
      success,
      duration,
      error
    });

    // Keep only recent history
    const maxSize = this.getConfig().maxExecutionHistory || 1000;
    if (this.executionHistory.length > maxSize) {
      this.executionHistory = this.executionHistory.slice(-maxSize);
    }
  }

  private createFailureBelief(goal: CognitiveItem, error: any): CognitiveItem {
    const failureBelief = CognitiveItemFactory.createBelief(
      `action-failure-${goal.id}`,
      { frequency: 0.0, confidence: 0.9 }, // Low frequency (failed), high confidence
      { priority: 0.8, durability: 0.7 }
    );
    failureBelief.label = `Action execution failed for goal "${goal.label || goal.id}": ${error.message || 'Unknown error'}`;

    return failureBelief;
  }

  private createNoExecutorBelief(goal: CognitiveItem): CognitiveItem {
    const noExecutorBelief = CognitiveItemFactory.createBelief(
      `no-executor-${goal.id}`,
      { frequency: 0.0, confidence: 0.8 }, // Low frequency (failed), medium confidence
      { priority: 0.6, durability: 0.5 }
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