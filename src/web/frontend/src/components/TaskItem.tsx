import React from 'react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  sendMessage: (message: any) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, sendMessage }) => {

  const handleComplete = () => {
    sendMessage({ type: 'COMPLETE_TASK', payload: { id: task.id } });
  };

  const handlePause = () => {
    sendMessage({ type: 'PAUSE_AGENT', payload: { id: task.id } });
  };

  const handleResume = () => {
    sendMessage({ type: 'RESUME_AGENT', payload: { id: task.id } });
  };

  const renderControls = () => {
    if (task.type === 'AGENT') {
      const isPaused = task.status === 'DEFERRED';
      return (
        <div>
          {isPaused ? (
            <button onClick={handleResume}>Resume</button>
          ) : (
            <button onClick={handlePause}>Pause</button>
          )}
          {/* A 'Stop' button would likely be a 'fail' or 'remove' action */}
          <button>Stop</button>
        </div>
      );
    } else {
      return (
        <div>
          <button onClick={handleComplete}>Complete</button>
        </div>
      );
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px', opacity: task.status === 'COMPLETED' ? 0.5 : 1 }}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>Status: {task.status}</p>
      {renderControls()}
    </div>
  );
};

export default TaskItem;
