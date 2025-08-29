import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { FaPlay, FaPause, FaStop, FaCheck, FaExclamationTriangle, FaHourglassHalf, FaInfoCircle, FaBolt, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import TaskList from './TaskList'; // Import TaskList for recursive rendering

interface TaskItemProps {
  task: Task;
  allFilteredTasks: Task[];
  sendMessage: (message: any) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string }> = {
  PENDING: { icon: FaHourglassHalf, color: '#6c757d' },
  IN_PROGRESS: { icon: FaBolt, color: '#0d6efd' },
  COMPLETED: { icon: FaCheck, color: '#198754' },
  PAUSED: { icon: FaPause, color: '#ffc107' },
  FAILED: { icon: FaExclamationTriangle, color: '#dc3545' },
  DEFERRED: { icon: FaPause, color: '#ffc107' },
  AWAITING_DEPENDENCIES: { icon: FaHourglassHalf, color: '#6c757d' },
  DECOMPOSING: { icon: FaBolt, color: '#0d6efd' },
  AWAITING_SUBTASKS: { icon: FaHourglassHalf, color: '#6c757d' },
  READY_FOR_EXECUTION: { icon: FaBolt, color: '#0d6efd' },
  completed: { icon: FaCheck, color: '#198754' },
  failed: { icon: FaExclamationTriangle, color: '#dc3545' },
  deferred: { icon: FaPause, color: '#ffc107' },
  pending: { icon: FaHourglassHalf, color: '#6c757d' },
};

const priorityConfig: Record<TaskPriority, { color: string }> = {
  low: { color: '#6c757d' },
  medium: { color: '#0d6efd' },
  high: { color: '#ffc107' },
  critical: { color: '#dc3545' },
};

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const { icon: Icon, color } = statusConfig[status] || { icon: FaInfoCircle, color: '#6c757d' };
  return (
    <span className="status-badge" style={{ backgroundColor: color }}>
      <Icon />
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const { color } = priorityConfig[priority] || { color: '#6c757d' };
  return (
    <span className="priority-badge" style={{ backgroundColor: color }}>
      {priority}
    </span>
  );
};

const ProgressBar: React.FC<{ percentage?: number }> = ({ percentage = 0 }) => (
  <div className="progress-bar-container">
    <div className="progress-bar" style={{ width: `${percentage}%` }} />
  </div>
);

const TaskControls: React.FC<{ task: Task; sendMessage: (msg: any) => void }> = ({ task, sendMessage }) => {
  const handleComplete = () => sendMessage({ type: 'COMPLETE_TASK', payload: { id: task.id } });
  const handlePause = () => sendMessage({ type: 'PAUSE_AGENT', payload: { id: task.id } });
  const handleResume = () => sendMessage({ type: 'RESUME_AGENT', payload: { id: task.id } });
  const handleStop = () => sendMessage({ type: 'FAIL_TASK', payload: { id: task.id } });

  if (task.type === 'AGENT') {
    const isPaused = task.status === 'DEFERRED' || task.status === 'PAUSED';
    return (
      <div className="task-controls">
        {isPaused ? (
          <button onClick={handleResume} title="Resume" className="resume-btn"><FaPlay /></button>
        ) : (
          <button onClick={handlePause} title="Pause" className="pause-btn"><FaPause /></button>
        )}
        <button onClick={handleStop} title="Stop" className="stop-btn"><FaStop /></button>
      </div>
    );
  } else {
    return (
      <div className="task-controls">
        <button onClick={handleComplete} title="Complete" className="complete-btn"><FaCheck /></button>
      </div>
    );
  }
};

const TaskItem: React.FC<TaskItemProps> = ({ task, allFilteredTasks, sendMessage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDimmed = task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'completed' || task.status === 'failed';

  const subtasks = allFilteredTasks.filter(t => t.parent_id === task.id);
  const hasSubtasks = subtasks.length > 0;

  const handleToggleExpand = () => {
    if (hasSubtasks) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="task-item-container">
        <div className="task-item" style={{ opacity: isDimmed ? 0.6 : 1 }}>
        <div className="task-item-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={handleToggleExpand} className="expand-btn" disabled={!hasSubtasks}>
                {hasSubtasks ? (isExpanded ? <FaChevronDown /> : <FaChevronRight />) : <span style={{width: '1em'}} />}
            </button>
            <h3>{task.title}</h3>
            </div>
            <PriorityBadge priority={task.priority} />
        </div>
        <div className="task-item-body">
            <p>{task.description || 'No description provided.'}</p>
            <ProgressBar percentage={task.completion_percentage} />
        </div>
        <div className="task-item-footer">
            <StatusBadge status={task.status} />
            <TaskControls task={task} sendMessage={sendMessage} />
        </div>
        </div>
        {isExpanded && hasSubtasks && (
        <div className="sub-task-container">
            <TaskList tasks={subtasks} sendMessage={sendMessage} isSublist={true} />
        </div>
        )}
    </div>
  );
};

export default TaskItem;
