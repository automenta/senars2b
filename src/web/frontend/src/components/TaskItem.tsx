import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../types';
import { FaChevronDown, FaChevronRight, FaStream } from 'react-icons/fa';
import TaskList from './TaskList';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import TaskControls from './TaskControls';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  allFilteredTasks: Task[];
  sendMessage: (message: any) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, allFilteredTasks, sendMessage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDimmed = ['COMPLETED', 'FAILED'].includes(task.status.toUpperCase());

  const subtasks = allFilteredTasks.filter(t => t.parent_id === task.id);
  const hasSubtasks = subtasks.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling
    if (hasSubtasks) {
      setIsExpanded(!isExpanded);
    }
  };

  const itemClassName = `${styles.item} ${isDimmed ? styles.dimmed : ''}`;

  return (
    <motion.div
      className={styles.container}
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className={itemClassName}>
        <div className={styles.mainInfo}>
          <button
            onClick={handleToggleExpand}
            className={styles.expandBtn}
            disabled={!hasSubtasks}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            {hasSubtasks ? (isExpanded ? <FaChevronDown /> : <FaChevronRight />) : <span className={styles.expandPlaceholder} />}
          </button>
          <div className={styles.titleAndDescription}>
            <h3 className={styles.title}>{task.title}</h3>
            <p className={styles.description}>{task.description || 'No description'}</p>
          </div>
        </div>
        <div className={styles.metaInfo}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {hasSubtasks && <div className={styles.subtaskIndicator}><FaStream /> {subtasks.length}</div>}
        </div>
        <div className={styles.progressContainer}>
          <ProgressBar percentage={task.completion_percentage} />
        </div>
        <div className={styles.controlsContainer}>
          <TaskControls task={task} sendMessage={sendMessage} />
        </div>
      </div>
      {isExpanded && hasSubtasks && (
        <div className={styles.subTaskContainer}>
          <TaskList tasks={subtasks} sendMessage={sendMessage} isSublist={true} />
        </div>
      )}
    </motion.div>
  );
};

export default TaskItem;
