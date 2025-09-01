import React from 'react';
import { Task } from '../../types';
import styles from './PriorityGroups.module.css';
import { FaExclamationTriangle, FaPlus, FaTasks } from 'react-icons/fa';
import TaskCard from './TaskCard';

interface PriorityGroupsProps {
  tasks: Task[];
  onTaskAction: (action: string, taskId: string) => void;
  onAddTask: () => void;
}

const PriorityGroups: React.FC<PriorityGroupsProps> = ({ tasks, onTaskAction, onAddTask }) => {
  // Group tasks by priority
  const priorityGroups: Record<string, Task[]> = {
    'critical': [],
    'high': [],
    'medium': [],
    'low': []
  };

  tasks.forEach(task => {
    priorityGroups[task.priority].push(task);
  });

  const hasTasks = tasks.length > 0;

  return (
    <div className={styles.priorityGroupsContainer}>
      <div className={styles.priorityGroupsHeader}>
        <h2>Priority Groups</h2>
        <button 
          className="btn btn-primary"
          onClick={onAddTask}
        >
          <FaPlus /> Add Task
        </button>
      </div>

      {hasTasks ? (
        <div className={styles.priorityGroups}>
          {Object.entries(priorityGroups).map(([priority, priorityTasks]) => (
            <div key={priority} className={styles.priorityGroup}>
              <div className={`${styles.priorityHeader} ${styles[priority]}`}>
                <div className={styles.priorityTitle}>
                  <FaExclamationTriangle className={styles.priorityIcon} />
                  <h3>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</h3>
                </div>
                <span className={styles.taskCount}>{priorityTasks.length} tasks</span>
              </div>
              
              <div className={styles.priorityTasks}>
                {priorityTasks.length > 0 ? (
                  priorityTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={false}
                      isExpanded={false}
                      onToggleSelect={() => {}}
                      onToggleExpand={() => {}}
                      sendMessage={(message) => onTaskAction(message.type, task.id)}
                    />
                  ))
                ) : (
                  <div className={styles.emptyGroup}>
                    <p>No tasks with {priority} priority</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FaTasks className={styles.emptyStateIcon} />
          <h3>No tasks found</h3>
          <p>Create your first task to see it grouped by priority</p>
          <button 
            className="btn btn-primary"
            onClick={onAddTask}
          >
            <FaPlus /> Add Task
          </button>
        </div>
      )}
    </div>
  );
};

export default PriorityGroups;