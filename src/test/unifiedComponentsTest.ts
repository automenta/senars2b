import { UnifiedTaskManager } from '@/modules/UnifiedTaskManager';
import { UnifiedPriorityAgenda } from '@/core/UnifiedPriorityAgenda';
import { UnifiedWorldModel } from '@/core/UnifiedWorldModel';
import { UnifiedReflectionLoop } from '@/core/UnifiedReflectionLoop';
import { CognitiveItem } from '@/interfaces/types';

// Mock implementations for testing
const mockGetTaskStatus = (taskId: string): any => {
  // Mock implementation
  return 'pending';
};

// Test the unified components
export function testUnifiedComponents() {
  console.log('Testing unified components...');
  
  // Create instances of our unified components
  const worldModel = new UnifiedWorldModel();
  const agenda = new UnifiedPriorityAgenda(mockGetTaskStatus);
  const taskManager = new UnifiedTaskManager(agenda, worldModel, {
    enableHistoryTracking: true,
    maxHistorySize: 5,
    enableValidation: true
  });
  const reflectionLoop = new UnifiedReflectionLoop({
    cycleInterval: 5000, // 5 seconds for testing
    enableKpiTracking: true
  });
  
  console.log('All components created successfully');
  
  // Test adding a task
  try {
    const task = taskManager.addTask({
      label: 'Test Task',
      content: 'This is a test task',
      task_metadata: {
        status: 'pending',
        priority_level: 'medium'
      }
    });
    
    console.log('Task created:', task.id);
    
    // Test updating a task
    const updatedTask = taskManager.updateTask(task.id, {
      task_metadata: {
        status: 'completed'
      }
    });
    
    if (updatedTask) {
      console.log('Task updated:', updatedTask.task_metadata?.status);
    }
    
    // Test getting tasks
    const allTasks = taskManager.getAllTasks();
    console.log('Total tasks:', allTasks.length);
    
    // Test statistics
    const stats = taskManager.getTaskStatistics();
    console.log('Task statistics:', stats);
    
    // Test world model
    const worldStats = worldModel.getStatistics();
    console.log('World model statistics:', worldStats);
    
    // Test agenda
    console.log('Agenda size:', agenda.size());
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testUnifiedComponents();
}