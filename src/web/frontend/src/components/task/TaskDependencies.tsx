import React, { useState, useMemo } from 'react';
import { Task } from '../../types';
import { FaProjectDiagram, FaTasks, FaPlus } from 'react-icons/fa';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import styles from './TaskDependencies.module.css';

interface TaskDependenciesProps {
  tasks: Task[];
  onAddTask: () => void;
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({ tasks, onAddTask }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Find tasks with dependencies or that are dependencies of other tasks
  const dependencyTasks = useMemo(() => {
    const depTasks: Task[] = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    tasks.forEach(task => {
      // Add tasks that have dependencies
      if (task.parent_id) {
        depTasks.push(task);
      }
      
      // Add tasks that are parents of other tasks
      if (tasks.some(t => t.parent_id === task.id)) {
        depTasks.push(task);
      }
    });
    
    // Remove duplicates
    return Array.from(new Set(depTasks));
  }, [tasks]);
  
  const hasTasks = tasks.length > 0;
  const hasDependencyTasks = dependencyTasks.length > 0;
  
  return (
    <div className={styles.taskDependenciesContainer}>
      <div className={styles.dependenciesHeader}>
        <h2>Task Dependencies</h2>
        <button 
          className="btn btn-primary"
          onClick={onAddTask}
        >
          <FaPlus /> Add Task
        </button>
      </div>
      
      {hasTasks ? (
        <div className={styles.dependenciesVisualization}>
          {hasDependencyTasks ? (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 'var(--spacing-lg)' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-xl)', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center' 
                }}>
                  {dependencyTasks.map(task => (
                    <div 
                      key={task.id}
                      className={`${styles.node} ${styles[task.status]}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <h3 className={styles.nodeTitle}>{task.title}</h3>
                      <div className={styles.nodeStatus}>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))}
                </div>
                
                <svg width="100%" height="100" style={{ marginTop: 'var(--spacing-lg)' }}>
                  <defs>
                    <marker 
                      id="arrowhead" 
                      markerWidth="10" 
                      markerHeight="7" 
                      refX="9" 
                      refY="3.5" 
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-primary)" />
                    </marker>
                  </defs>
                  
                  {/* Example edges - in a real implementation, this would be dynamically generated */}
                  {dependencyTasks.length > 1 && (
                    <line 
                      x1="100" 
                      y1="50" 
                      x2="300" 
                      y2="50" 
                      className={styles.edge} 
                    />
                  )}
                </svg>
              </div>
              
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.pending}`}></div>
                  <span>Pending</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.completed}`}></div>
                  <span>Completed</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.failed}`}></div>
                  <span>Failed</span>
                </div>
              </div>
              
              {selectedTask && (
                <div className={styles.taskDetail}>
                  <div className={styles.taskDetailHeader}>
                    <h3>{selectedTask.title}</h3>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedTask(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className={styles.taskDetailContent}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status</span>
                      <span className={styles.detailValue}>
                        <StatusBadge status={selectedTask.status} />
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Priority</span>
                      <span className={styles.detailValue}>
                        <PriorityBadge priority={selectedTask.priority} />
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Description</span>
                      <span className={styles.detailValue}>
                        {selectedTask.description || 'No description'}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>ID</span>
                      <span className={styles.detailValue}>{selectedTask.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <FaProjectDiagram className={styles.emptyStateIcon} />
              <h3>No task dependencies found</h3>
              <p>Create tasks with parent-child relationships to visualize dependencies</p>
              <button 
                className="btn btn-primary"
                onClick={onAddTask}
              >
                <FaPlus /> Add Task
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FaTasks className={styles.emptyStateIcon} />
          <h3>No tasks found</h3>
          <p>Create your first task to see dependency visualization</p>
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

export default TaskDependencies;