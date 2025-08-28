import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import { Task } from './types';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      const { type, payload } = lastMessage;
      if (type === 'TASK_LIST_UPDATE') {
        setTasks(payload.tasks);
      }
    }
  }, [lastMessage]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      sendMessage({
        type: 'ADD_TASK',
        payload: { title: newTaskTitle.trim(), type: 'REGULAR' }
      });
      setNewTaskTitle('');
    }
  };

  const connectionStatus = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div>
      <h1>Senars3 Planner</h1>
      <p>Connection Status: {connectionStatus}</p>

      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter a new task..."
        />
        <button type="submit">Add Task</button>
      </form>

      <TaskList tasks={tasks} sendMessage={sendMessage} />
    </div>
  );
}

export default App;
