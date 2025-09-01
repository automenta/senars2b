import { CognitiveItem } from '../interfaces/types';
import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';

interface ExecutorConfig extends BaseConfig {
  enableExecutionLogging?: boolean;
  maxExecutionTime?: number;
  retryAttempts?: number;
}

interface ExecutorEvents {
  executionStarted: { goalId: string; executorType: string };
  executionCompleted: { goalId: string; executorType: string; duration: number; success: boolean };
  executionFailed: { goalId: string; executorType: string; error: Error };
}

/**
 * Abstract base class for executors with unified base component functionality
 */
export abstract class UnifiedExecutor extends UnifiedBaseComponent<ExecutorConfig, ExecutorEvents> {
  constructor(
    executorName: string,
    defaultConfig: ExecutorConfig,
    userConfig: Partial<ExecutorConfig> = {}
  ) {
    super(executorName, defaultConfig, userConfig);
  }

  /**
   * Check if this executor can handle the given goal
   */
  abstract canExecute(goal: CognitiveItem): boolean;

  /**
   * Execute the goal and return a result
   */
  abstract execute(goal: CognitiveItem): Promise<CognitiveItem>;

  /**
   * Execute with error handling and logging
   */
  async executeWithLogging(goal: CognitiveItem): Promise<CognitiveItem | null> {
    const startTime = Date.now();
    
    // Notify execution start
    this.notifyEvent('executionStarted', { 
      goalId: goal.id, 
      executorType: this.componentName 
    }, {
      component: this.componentName,
      operation: 'executeWithLogging',
      goalId: goal.id
    });
    
    try {
      if (this.getConfig().enableExecutionLogging) {
        this.getLogger().info({
          goalId: goal.id, 
          goalLabel: goal.label, 
          executor: this.componentName
        }, `Executing goal with ${this.componentName}`);
      }
      
      const result = await this.execute(goal);
      
      if (this.getConfig().enableExecutionLogging) {
        this.getLogger().info({
          goalId: goal.id, 
          duration: Date.now() - startTime,
          executor: this.componentName
        }, `Successfully executed goal with ${this.componentName}`);
      }
      
      // Notify execution completion
      this.notifyEvent('executionCompleted', { 
        goalId: goal.id, 
        executorType: this.componentName,
        duration: Date.now() - startTime,
        success: true
      }, {
        component: this.componentName,
        operation: 'executeWithLogging',
        goalId: goal.id,
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      if (this.getConfig().enableExecutionLogging) {
        this.getLogger().error({
          error, 
          goalId: goal.id, 
          goalLabel: goal.label, 
          executor: this.componentName,
          duration: Date.now() - startTime
        }, `Executor ${this.componentName} failed for goal`);
      }
      
      // Notify execution failure
      this.notifyEvent('executionFailed', { 
        goalId: goal.id, 
        executorType: this.componentName,
        error: error as Error
      }, {
        component: this.componentName,
        operation: 'executeWithLogging',
        goalId: goal.id
      });
      
      return null;
    }
  }

  /**
   * Create a failure belief when execution fails
   */
  protected createFailureBelief(goal: CognitiveItem, error: any): CognitiveItem {
    // This would be implemented by subclasses or use a factory
    throw new Error('createFailureBelief must be implemented by subclass');
  }

  /**
   * Create a belief for when no executor is found
   */
  protected createNoExecutorBelief(goal: CognitiveItem): CognitiveItem {
    // This would be implemented by subclasses or use a factory
    throw new Error('createNoExecutorBelief must be implemented by subclass');
  }
}