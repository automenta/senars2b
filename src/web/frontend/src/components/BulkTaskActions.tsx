import React from 'react';
import styles from './BulkTaskActions.module.css';
import { FaCheck, FaExclamationTriangle, FaPause, FaPlay, FaTrash } from 'react-icons/fa';

interface BulkTaskActionsProps {
  selectedTasks: string[];
  onMarkComplete: () => void;
  onMarkFailed: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  totalTasks: number;
}

const BulkTaskActions: React.FC<BulkTaskActionsProps> = ({
  selectedTasks,
  onMarkComplete,
  onMarkFailed,
  onPause,
  onResume,
  onDelete,
  onClearSelection,
  totalTasks
}) => {
  const selectedCount = selectedTasks.length;
  
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={styles.bulkActionsContainer}>
      <div className={styles.bulkActionsInfo}>
        <span className={styles.selectedCount}>
          {selectedCount} of {totalTasks} tasks selected
        </span>
        <button 
          className={styles.clearSelectionButton}
          onClick={onClearSelection}
        >
          Clear selection
        </button>
      </div>
      
      <div className={styles.bulkActionsButtons}>
        <button 
          className={`${styles.bulkActionButton} ${styles.completeButton}`}
          onClick={onMarkComplete}
          title="Mark selected tasks as complete"
        >
          <FaCheck /> Complete
        </button>
        
        <button 
          className={`${styles.bulkActionButton} ${styles.failButton}`}
          onClick={onMarkFailed}
          title="Mark selected tasks as failed"
        >
          <FaExclamationTriangle /> Fail
        </button>
        
        <button 
          className={`${styles.bulkActionButton} ${styles.pauseButton}`}
          onClick={onPause}
          title="Pause selected agent tasks"
        >
          <FaPause /> Pause
        </button>
        
        <button 
          className={`${styles.bulkActionButton} ${styles.resumeButton}`}
          onClick={onResume}
          title="Resume selected agent tasks"
        >
          <FaPlay /> Resume
        </button>
        
        <button 
          className={`${styles.bulkActionButton} ${styles.deleteButton}`}
          onClick={onDelete}
          title="Delete selected tasks"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default BulkTaskActions;