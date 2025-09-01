import { CognitiveItem } from '../interfaces/types';
import logger from '../services/logger';

/**
 * Abstract base class for executors to reduce redundancy
 */
export abstract class BaseExecutor {
  protected executorName: string;

  constructor(executorName: string) {
    this.executorName = executorName;
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
    
    try {
      logger.info({
        goalId: goal.id, 
        goalLabel: goal.label, 
        executor: this.executorName
      }, `Executing goal with ${this.executorName}`);
      
      const result = await this.execute(goal);
      
      logger.info({
        goalId: goal.id, 
        duration: Date.now() - startTime,
        executor: this.executorName
      }, `Successfully executed goal with ${this.executorName}`);
      
      return result;
    } catch (error) {
      logger.error({
        error, 
        goalId: goal.id, 
        goalLabel: goal.label, 
        executor: this.executorName,
        duration: Date.now() - startTime
      }, `Executor ${this.executorName} failed for goal`);
      
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