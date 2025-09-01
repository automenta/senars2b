import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import { FaChevronDown, FaChevronRight, FaEdit, FaTrash, FaCheck, FaPause, FaPlay, FaStop, FaEllipsisV } from 'react-icons/fa';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import ProgressBar from '../ProgressBar';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  sendMessage: (message: any) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  sendMessage
}) => {
  const [showActions, setShowActions] = useState(false);

  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';
  const isAgentTask = task.type === 'AGENT';
  const isPaused = task.status === 'paused' || task.status === 'deferred';

  const handleComplete = useCallback(() => {
    sendMessage({
      type: 'COMPLETE_TASK',
      payload: { id: task.id }
    });
  }, [sendMessage, task.id]);

  const handleDelete = useCallback(() => {
    sendMessage({
      type: 'DELETE_TASK',
      payload: { id: task.id }
    });
  }, [sendMessage, task.id]);

  const handlePause = useCallback(() => {
    sendMessage({
      type: 'PAUSE_AGENT',
      payload: { id: task.id }
    });
  }, [sendMessage, task.id]);

  const handleResume = useCallback(() => {
    sendMessage({
      type: 'RESUME_AGENT',
      payload: { id: task.id }
    });
  }, [sendMessage, task.id]);

  const handleStop = useCallback(() => {
    sendMessage({
      type: 'FAIL_TASK',
      payload: { id: task.id }
    });
  }, [sendMessage, task.id]);

  const handleEdit = useCallback(() => {
    // TODO: Implement edit functionality
    console.log('Edit task:', task.id);
  }, [task.id]);

  return (
    <motion.div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${isCompleted ? styles.completed : ''} ${isFailed ? styles.failed : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.selectionArea}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className={styles.checkbox}
          />
          <button
            onClick={onToggleExpand}
            className={styles.expandButton}
            aria-label={isExpanded ? "Collapse task details" : "Expand task details"}
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        </div>
        
        <div className={styles.titleArea}>
          <h3 className={styles.title}>{task.title}</h3>
          <div className={styles.badges}>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        
        <div className={styles.actionsArea}>
          <AnimatePresence>
            {showActions && (
              <motion.div
                className={styles.quickActions}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {isAgentTask ? (
                  <>
                    {isPaused ? (
                      <button
                        onClick={handleResume}
                        className={`${styles.actionButton} ${styles.resumeButton}`}
                        title="Resume task"
                      >
                        <FaPlay />
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        className={`${styles.actionButton} ${styles.pauseButton}`}
                        title="Pause task"
                      >
                        <FaPause />
                      </button>
                    )}
                    <button
                      onClick={handleStop}
                      className={`${styles.actionButton} ${styles.stopButton}`}
                      title="Stop task"
                    >
                      <FaStop />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleComplete}
                    className={`${styles.actionButton} ${styles.completeButton}`}
                    title="Complete task"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  onClick={handleEdit}
                  className={`${styles.actionButton} ${styles.editButton}`}
                  title="Edit task"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title="Delete task"
                >
                  <FaTrash />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show context menu
            }}
            aria-label="More actions"
          >
            <FaEllipsisV />
          </button>
        </div>
      </div>
      
      <div className={styles.progressBar}>
        <ProgressBar percentage={task.completion_percentage || 0} />
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.details}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.description}>
              {task.description || <span className={styles.noDescription}>No description provided</span>}
            </div>
            
            <div className={styles.metadata}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>ID:</span>
                <span className={styles.metadataValue}>{task.id}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Type:</span>
                <span className={styles.metadataValue}>{task.type}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Status:</span>
                <span className={styles.metadataValue}>{task.status}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Priority:</span>
                <span className={styles.metadataValue}>{task.priority}</span>
              </div>
              {task.parent_id && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Parent Task:</span>
                  <span className={styles.metadataValue}>{task.parent_id}</span>
                </div>
              )}
            </div>
            
            {task.subtasks && task.subtasks.length > 0 && (
              <div className={styles.subtasks}>
                <h4>Subtasks ({task.subtasks.length})</h4>
                <ul>
                  {task.subtasks.map((subtask, index) => (
                    <li key={index} className={styles.subtaskItem}>
                      <span className={styles.subtaskTitle}>{subtask.title}</span>
                      <span className={styles.subtaskStatus}>{subtask.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;