import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import ProcessingView from './views/ProcessingView';
import TasksView from './views/TasksView';
import ConfigurationView from './views/ConfigurationView';
import CliView from './views/CliView';
import AddTaskModal from './components/AddTaskModal';
import { Task, TaskPriority, TaskStatistics } from './types';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [activeView, setActiveView] = useState('Dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'TASK_LIST_UPDATE') {
      setTasks(message.payload.tasks);
    }
  }, []);

  const { sendMessage } = useWebSocket(handleMessage);

  const handleAddTask = (task: { title: string; description?: string; priority: TaskPriority, type: 'REGULAR' | 'AGENT' }) => {
    sendMessage({
      type: 'ADD_TASK',
      payload: {
        title: task.title,
        type: task.type,
        priority_level: task.priority,
        description: task.description,
      }
    });
    setIsModalOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Processing':
        return <ProcessingView />;
      case 'Tasks':
        return (
          <TasksView
            tasks={tasks}
            sendMessage={sendMessage}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        );
      case 'Configuration':
        return <ConfigurationView />;
      case 'CLI':
        return <CliView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} onSelectView={setActiveView} />
      <main className="main-content">
        <Header title={activeView} onAddTask={() => setIsModalOpen(true)} />
        {renderView()}
      </main>
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
}

export default App;
