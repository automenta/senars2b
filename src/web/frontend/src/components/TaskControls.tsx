import React from 'react';
import { Task } from '../types';
import { FaPlay, FaPause, FaStop, FaCheck } from 'react-icons/fa';
import styles from './TaskControls.module.css';

interface TaskControlsProps {
  task: Task;
  sendMessage: (msg: any) => void;
}

const TaskControls: React.FC<TaskControlsProps> = ({ task, sendMessage }) => {
  const handleComplete = () => sendMessage({ type: 'COMPLETE_TASK', payload: { id: task.id } });
  const handlePause = () => sendMessage({ type: 'PAUSE_AGENT', payload: { id: task.id } });
  const handleResume = () => sendMessage({ type: 'RESUME_AGENT', payload: { id: task.id } });
  const handleStop = () => sendMessage({ type: 'FAIL_TASK', payload: { id: task.id } });

  if (task.type === 'AGENT') {
    const isPaused = task.status === 'DEFERRED' || task.status === 'PAUSED';
    return (
      <div className={styles.controls}>
        {isPaused ? (
          <button onClick={handleResume} title="Resume" aria-label={`Resume task ${task.title}`} className={`${styles.button} ${styles.resumeBtn}`}><FaPlay /></button>
        ) : (
          <button onClick={handlePause} title="Pause" aria-label={`Pause task ${task.title}`} className={`${styles.button} ${styles.pauseBtn}`}><FaPause /></button>
        )}
        <button onClick={handleStop} title="Stop" aria-label={`Stop task ${task.title}`} className={`${styles.button} ${styles.stopBtn}`}><FaStop /></button>
      </div>
    );
  } else {
    return (
      <div className={styles.controls}>
        <button onClick={handleComplete} title="Complete" aria-label={`Complete task ${task.title}`} className={`${styles.button} ${styles.completeBtn}`}><FaCheck /></button>
      </div>
    );
  }
};

export default TaskControls;
