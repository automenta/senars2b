import React, { useMemo } from 'react';
import { Task } from '../../types';
import styles from './TaskTimeline.module.css';
import { FaCalendarAlt, FaPlus, FaTasks } from 'react-icons/fa';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';

interface TaskTimelineProps {
  tasks: Task[];
  onTaskAction: (action: string, taskId: string) => void;
  onAddTask: () => void;
}

const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks, onTaskAction, onAddTask }) => {
  // Group tasks by date (for demo purposes, we'll use created_at or a mock date)
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    // For demo purposes, we'll group by status to simulate timeline
    tasks.forEach(task => {
      const dateKey = task.status; // In a real implementation, this would be a date
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });
    
    return groups;
  }, [tasks]);

  const statusOrder: Record<string, number> = {
    'pending': 1,
    'awaiting_dependencies': 2,
    'decomposing': 3,
    'awaiting_subtasks': 4,
    'ready_for_execution': 5,
    'completed': 6,
    'failed': 7,
    'deferred': 8
  };

  const sortedStatuses = Object.keys(groupedTasks).sort((a, b) => {
    return (statusOrder[a] || 999) - (statusOrder[b] || 999);
  });

  const hasTasks = tasks.length > 0;

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineHeader}>
        <h2>Task Timeline</h2>
        <button 
          className="btn btn-primary"
          onClick={onAddTask}
        >
          <FaPlus /> Add Task
        </button>
      </div>

      {hasTasks ? (
        <div className={styles.timeline}>
          {sortedStatuses.map(status => (
            <div key={status} className={styles.timelineSection}>
              <div className={styles.timelineDate}>
                <h3>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <span className={styles.taskCount}>{groupedTasks[status].length} tasks</span>
              </div>
              
              <div className={styles.timelineEvents}>
                {groupedTasks[status].map(task => (
                  <div key={task.id} className={styles.timelineEvent}>
                    <div className={styles.eventIndicator}>
                      <div className={`${styles.indicator} ${styles[task.status]}`}></div>
                      <div className={styles.connector}></div>
                    </div>
                    
                    <div className={styles.eventContent}>
                      <div className={styles.eventHeader}>
                        <h4 className={styles.eventTitle}>{task.title}</h4>
                        <div className={styles.eventBadges}>
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                      </div>
                      
                      <p className={styles.eventDescription}>
                        {task.description || 'No description provided'}
                      </p>
                      
                      <div className={styles.eventActions}>
                        {task.status === 'pending' && (
                          <button 
                            className="btn btn-success"
                            onClick={() => onTaskAction('COMPLETE_TASK', task.id)}
                          >
                            Complete
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className={styles.completedText}>Completed</span>
                        )}
                        {task.status === 'failed' && (
                          <span className={styles.failedText}>Failed</span>
                        )}
                        {task.type === 'AGENT' && task.status !== 'completed' && task.status !== 'failed' && (
                          <button 
                            className="btn btn-warning"
                            onClick={() => onTaskAction('PAUSE_AGENT', task.id)}
                          >
                            Pause
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FaTasks className={styles.emptyStateIcon} />
          <h3>No tasks found</h3>
          <p>Create your first task to see it in the timeline</p>
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

export default TaskTimeline;