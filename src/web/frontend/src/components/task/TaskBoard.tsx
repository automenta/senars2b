import React, { useMemo, useCallback, useState } from 'react';
import { Task, TaskStatus } from '../../types';
import TaskCard from './TaskCard';
import styles from './TaskBoard.module.css';
import { FaPlus, FaTasks } from 'react-icons/fa';

interface TaskBoardProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
  onAddTask?: (status: TaskStatus) => void;
}

// Define columns for the board view based on task statuses
const columns: { id: TaskStatus, title: string, color: string }[] = [
  { id: 'pending', title: 'Pending', color: 'var(--color-pending)' },
  { id: 'awaiting_dependencies', title: 'Awaiting Dependencies', color: 'var(--color-awaiting)' },
  { id: 'decomposing', title: 'Decomposing', color: 'var(--color-decomposing)' },
  { id: 'awaiting_subtasks', title: 'Awaiting Subtasks', color: 'var(--color-awaiting)' },
  { id: 'ready_for_execution', title: 'Ready for Execution', color: 'var(--color-ready)' },
  { id: 'completed', title: 'Completed', color: 'var(--color-completed)' },
  { id: 'failed', title: 'Failed', color: 'var(--color-failed)' },
  { id: 'deferred', title: 'Deferred', color: 'var(--color-deferred)' }
];

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, sendMessage, onAddTask }) => {
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {} as Record<TaskStatus, Task[]>;

    // Initialize empty arrays for each status
    columns.forEach(column => {
      grouped[column.id] = [];
    });

    // Group tasks
    tasks.forEach(task => {
      if (task.status in grouped) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleAddTaskToColumn = useCallback((status: TaskStatus) => {
    if (onAddTask) {
      onAddTask(status);
    }
  }, [onAddTask]);

  const handleTaskAction = useCallback((action: string, taskId: string) => {
    sendMessage({
      type: action,
      payload: { id: taskId }
    });
  }, [sendMessage]);

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      // Send message to update task status
      sendMessage({
        type: 'UPDATE_TASK_STATUS',
        payload: { 
          id: draggedTask.id, 
          status 
        }
      });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }, [draggedTask, sendMessage]);

  return (
    <div className={styles.board}>
      {columns.map(column => (
        <div 
          key={column.id} 
          className={`${styles.column} ${dragOverColumn === column.id ? styles.dragOver : ''}`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div 
            className={styles.columnHeader}
            style={{ borderBottomColor: column.color }}
          >
            <div className={styles.columnTitle}>
              <h3>{column.title}</h3>
              <span className={styles.taskCount}>{tasksByStatus[column.id].length}</span>
            </div>
            <button
              className={styles.addColumnButton}
              onClick={() => handleAddTaskToColumn(column.id)}
              aria-label={`Add task to ${column.title}`}
            >
              <FaPlus />
            </button>
          </div>
          <div className={styles.taskList}>
            {tasksByStatus[column.id].map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(task)}
                className={styles.draggableTask}
              >
                <TaskCard
                  task={task}
                  isSelected={false}
                  isExpanded={false}
                  onToggleSelect={() => {}}
                  onToggleExpand={() => {}}
                  sendMessage={(message) => handleTaskAction(message.type, task.id)}
                />
              </div>
            ))}
            {tasksByStatus[column.id].length === 0 && (
              <div className={styles.emptyColumn}>
                <FaTasks className={styles.emptyIcon} />
                <p>No tasks in this column</p>
                <button
                  className={styles.addTaskButton}
                  onClick={() => handleAddTaskToColumn(column.id)}
                >
                  Add Task
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;