import { 
  RefactoredPersistentWorldModel, 
  RefactoredPriorityAgenda, 
  RefactoredReflectionLoop 
} from '@/core';
import { 
  UnifiedActionSubsystem, 
  RefactoredWebSearchExecutor, 
  RefactoredAtomicTaskExecutor, 
  RefactoredDiagnosticExecutor 
} from '@/actions';
import { CognitiveItemFactory } from '@/modules/cognitiveItemFactory';
import { TaskManager } from '@/modules/taskManager';

/**
 * Practical example demonstrating how to use the refactored components together
 */
export class CognitiveSystemExample {
  private worldModel: RefactoredPersistentWorldModel;
  private agenda: RefactoredPriorityAgenda;
  private reflectionLoop: RefactoredReflectionLoop;
  private actionSubsystem: UnifiedActionSubsystem;
  private taskManager: TaskManager;

  constructor() {
    // Initialize the task manager (simplified for this example)
    this.taskManager = new TaskManager();
    
    // Create world model with custom configuration
    this.worldModel = new RefactoredPersistentWorldModel({
      enableCompaction: true,
      compactionInterval: 1800000, // 30 minutes
      maxAtomCount: 50000,
      maxItemCount: 500000,
      enableSemanticIndexing: true,
      enableSymbolicIndexing: true
    });

    // Create agenda with custom configuration
    this.agenda = new RefactoredPriorityAgenda(
      (taskId: string) => {
        // In a real implementation, this would query the actual task status
        return this.taskManager.getTaskStatus(taskId);
      },
      {
        deadlineWindowMs: 43200000, // 12 hours
        maxWaitTime: 60000, // 1 minute
        enableDependencyTracking: true,
        taskPriorityWeight: 0.4,
        deadlineFactorWeight: 0.5,
        attentionPriorityWeight: 0.1,
        completionFactorWeight: -0.1
      }
    );

    // Create reflection loop with custom configuration
    this.reflectionLoop = new RefactoredReflectionLoop({
      cycleInterval: 30000, // 30 seconds
      enableKpiTracking: true,
      kpiHistorySize: 200,
      schemaUsageTracking: true,
      unusedSchemaThresholdMs: 7200000, // 2 hours
      memorySizeThreshold: 1000000, // 1M items
      agendaSizeThreshold: 10000 // 10K items
    });

    // Create action subsystem with custom configuration
    this.actionSubsystem = new UnifiedActionSubsystem(
      this.taskManager,
      {
        enableStatisticsTracking: true,
        maxExecutionHistory: 2000,
        defaultRetryAttempts: 3
      }
    );

    // Register executors
    this.actionSubsystem.addExecutor(new RefactoredWebSearchExecutor({
      maxSearchResults: 15,
      searchTimeoutMs: 15000 // 15 seconds
    }));
    
    this.actionSubsystem.addExecutor(new RefactoredAtomicTaskExecutor(this.taskManager, {
      maxTaskExecutionTime: 60000 // 1 minute
    }));
    
    this.actionSubsystem.addExecutor(new RefactoredDiagnosticExecutor({
      maxDiagnosticTime: 120000 // 2 minutes
    }));

    // Set up event listeners for monitoring
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // World model events
    this.worldModel.on('itemAdded', (event) => {
      console.log(`Item added to world model: ${event.item.id}`);
    });

    this.worldModel.on('itemRemoved', (event) => {
      console.log(`Item removed from world model: ${event.itemId}`);
    });

    // Agenda events
    this.agenda.on('itemAdded', (event) => {
      console.log(`Item added to agenda: ${event.item.id}`);
    });

    this.agenda.on('taskStatusUpdated', (event) => {
      console.log(`Task status updated: ${event.taskId} -> ${event.status}`);
    });

    // Reflection loop events
    this.reflectionLoop.on('cycleCompleted', (event) => {
      console.log(`Reflection cycle completed in ${event.duration}ms`);
    });

    this.reflectionLoop.on('kpiUpdated', (event) => {
      console.log(`KPI updated: ${event.kpiName} = ${event.value}`);
    });

    // Action subsystem events
    this.actionSubsystem.on('goalExecutionCompleted', (event) => {
      console.log(`Goal execution completed: ${event.goalId} (${event.success ? 'success' : 'failure'})`);
    });
  }

  /**
   * Initialize the cognitive system
   */
  async initialize(): Promise<void> {
    console.log('Initializing cognitive system...');
    
    // Start the reflection loop
    this.reflectionLoop.start();
    
    console.log('Cognitive system initialized successfully');
  }

  /**
   * Process a goal through the system
   */
  async processGoal(goalLabel: string): Promise<void> {
    // Create a goal
    const goal = CognitiveItemFactory.createGoal(
      `goal-${Date.now()}`,
      { priority: 0.8, durability: 0.7 }
    );
    goal.label = goalLabel;

    // Add to world model
    this.worldModel.add_item(goal);

    // Add to agenda
    this.agenda.push(goal);

    // Process from agenda
    const item = await this.agenda.pop();
    
    if (item) {
      console.log(`Processing item: ${item.label || item.id}`);
      
      // Execute the goal
      const result = await this.actionSubsystem.executeGoal(item);
      
      if (result) {
        console.log(`Execution result: ${result.label || result.id}`);
        // Add result to world model
        this.worldModel.add_item(result);
      }
    }
  }

  /**
   * Get system statistics
   */
  getStatistics(): any {
    return {
      worldModel: this.worldModel.getStatistics(),
      agenda: this.agenda.getStatistics(),
      reflectionLoop: this.reflectionLoop.getPerformanceMetrics(),
      actionSubsystem: this.actionSubsystem.getStatistics()
    };
  }

  /**
   * Shutdown the system
   */
  shutdown(): void {
    console.log('Shutting down cognitive system...');
    // In a real implementation, we would clean up resources here
    console.log('Cognitive system shut down successfully');
  }
}

// Example usage
async function example(): Promise<void> {
  const system = new CognitiveSystemExample();
  
  try {
    await system.initialize();
    
    // Process some goals
    await system.processGoal("Search for information about cat nutrition");
    await system.processGoal("Diagnose why my cat is not eating");
    await system.processGoal("Execute task to feed the cat");
    
    // Show statistics
    console.log('System Statistics:', system.getStatistics());
  } finally {
    system.shutdown();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  example().catch(console.error);
}