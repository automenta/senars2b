import { CognitiveItem } from '@/interfaces/types';
import { UnifiedExecutor, ExecutorConfig } from '@/actions/UnifiedExecutor';
import { CognitiveItemFactory } from '@/modules/cognitiveItemFactory';
import { TaskManager } from '@/modules/taskManager';
import { Logger } from '@/utils/standardLogger';

interface WebSearchExecutorConfig extends ExecutorConfig {
  maxSearchResults?: number;
  searchTimeoutMs?: number;
}

export class RefactoredWebSearchExecutor extends UnifiedExecutor {
  constructor(userConfig: Partial<WebSearchExecutorConfig> = {}) {
    const defaultConfig: WebSearchExecutorConfig = {
      enableExecutionLogging: true,
      maxExecutionTime: 30000, // 30 seconds
      retryAttempts: 3,
      maxSearchResults: 10,
      searchTimeoutMs: 10000 // 10 seconds
    };
    
    super('WebSearchExecutor', defaultConfig, userConfig);
  }

  canExecute(goal: CognitiveItem): boolean {
    // Check if this executor can handle the goal
    if (goal.type !== 'GOAL') return false;

    const label = goal.label || '';

    // Simple pattern matching for web search goals
    return label.toLowerCase().includes('search') ||
      label.toLowerCase().includes('find') ||
      label.toLowerCase().includes('lookup');
  }

  async execute(goal: CognitiveItem): Promise<CognitiveItem> {
    // Execute a web search
    // In a real implementation, this would actually perform the search
    if (this.getConfig().enableExecutionLogging) {
      Logger.info({ goalId: goal.id, goalLabel: goal.label }, `Executing web search for goal`);
    }

    // Simulate search result
    const resultContent = `Search results for "${goal.label || goal.id}" - Chocolate is indeed toxic to cats, just as it is to dogs. The toxicity is due to theobromine, which cats cannot metabolize effectively.`;

    // Create a belief from the search result
    const result = CognitiveItemFactory.createBelief(
      `search-result-${goal.id}`,
      {
        frequency: 1.0,
        confidence: 0.95
      },
      {
        priority: 0.9,
        durability: 0.8
      }
    );
    result.label = resultContent;

    return result;
  }
}

interface AtomicTaskExecutorConfig extends ExecutorConfig {
  maxTaskExecutionTime?: number;
}

export class RefactoredAtomicTaskExecutor extends UnifiedExecutor {
  private taskManager: TaskManager;

  constructor(taskManager: TaskManager, userConfig: Partial<AtomicTaskExecutorConfig> = {}) {
    const defaultConfig: AtomicTaskExecutorConfig = {
      enableExecutionLogging: true,
      maxExecutionTime: 30000, // 30 seconds
      retryAttempts: 3,
      maxTaskExecutionTime: 60000 // 1 minute
    };
    
    super('AtomicTaskExecutor', defaultConfig, userConfig);
    this.taskManager = taskManager;
  }

  canExecute(goal: CognitiveItem): boolean {
    return goal.type === 'GOAL' && goal.meta?.isAtomicExecution === true;
  }

  async execute(goal: CognitiveItem): Promise<CognitiveItem> {
    const taskId = goal.meta?.taskId;
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('AtomicTaskExecutor: Goal is missing a valid taskId in its metadata.');
    }

    if (this.getConfig().enableExecutionLogging) {
      Logger.info({ goalId: goal.id, goalLabel: goal.label, taskId }, `Executing atomic task via goal`);
    }

    // Mark the task as completed
    this.taskManager.updateTaskStatus(taskId, 'completed');

    // Create a belief that the task was completed
    const result = CognitiveItemFactory.createBelief(
      `atomic-task-execution-result-${goal.id}`,
      {
        frequency: 1.0,
        confidence: 1.0
      },
      {
        priority: 0.7,
        durability: 0.5
      }
    );
    result.label = `Successfully executed atomic task ${taskId}.`;

    return result;
  }
}

interface DiagnosticExecutorConfig extends ExecutorConfig {
  maxDiagnosticTime?: number;
}

export class RefactoredDiagnosticExecutor extends UnifiedExecutor {
  constructor(userConfig: Partial<DiagnosticExecutorConfig> = {}) {
    const defaultConfig: DiagnosticExecutorConfig = {
      enableExecutionLogging: true,
      maxExecutionTime: 30000, // 30 seconds
      retryAttempts: 3,
      maxDiagnosticTime: 60000 // 1 minute
    };
    
    super('DiagnosticExecutor', defaultConfig, userConfig);
  }

  canExecute(goal: CognitiveItem): boolean {
    // Check if this executor can handle diagnostic goals
    if (goal.type !== 'GOAL') return false;

    const label = goal.label || '';
    return label.toLowerCase().includes('diagnose') ||
      label.toLowerCase().includes('diagnostic');
  }

  async execute(goal: CognitiveItem): Promise<CognitiveItem> {
    // Execute a diagnostic process
    if (this.getConfig().enableExecutionLogging) {
      Logger.info({ goalId: goal.id, goalLabel: goal.label }, `Executing diagnostic for goal`);
    }

    // Simulate diagnostic result
    const resultContent = `Diagnostic analysis complete. Based on symptoms and known facts, the most likely cause of illness is chocolate poisoning. Immediate veterinary attention is recommended.`;

    // Create a belief from the diagnostic result
    const result = CognitiveItemFactory.createBelief(
      `diagnostic-result-${goal.id}`,
      {
        frequency: 0.9,
        confidence: 0.85
      },
      {
        priority: 0.95,
        durability: 0.9
      }
    );
    result.label = resultContent;

    return result;
  }
}