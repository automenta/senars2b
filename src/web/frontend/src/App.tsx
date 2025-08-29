import React, { useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import ProcessingView from './views/ProcessingView';
import TasksView from './views/TasksView';
import ConfigurationView from './views/ConfigurationView';
import CliView from './views/CliView';
import AddTaskModal from './components/AddTaskModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store';
import { Task } from './types';

function App() {
  const {
    activeView,
    tasks,
    searchTerm,
    statusFilter,
    isModalOpen,
    theme,
    setActiveView,
    setTasks,
    addTask,
    setSearchTerm,
    setStatusFilter,
    setIsModalOpen,
    toggleTheme,
  } = useStore();

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'TASK_LIST_UPDATE') {
      const newTasks = message.payload.tasks;
      const tempId = message.payload.tempId;

      if (tempId) {
        setTasks(
          tasks.map(task =>
            task.id === tempId ? newTasks.find((t: Task) => t.title === task.title) || task : task
          )
        );
      } else {
        setTasks(newTasks);
      }
    }
  }, [setTasks, tasks]);

  const { sendMessage } = useWebSocket(handleMessage);

  const handleAddTask = (task: { title: string; description?: string; priority: TaskPriority, type: 'REGULAR' | 'AGENT' }) => {
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      type: task.type,
      status: 'PENDING',
      completion_percentage: 0,
      parent_id: null,
      subtasks: [],
    };

    addTask(newTask);
    setIsModalOpen(false);

    sendMessage({
      type: 'ADD_TASK',
      payload: {
        title: task.title,
        type: task.type,
        priority_level: task.priority,
        description: task.description,
        tempId: tempId,
      }
    });
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
        <Header
          title={activeView}
          onAddTask={() => setIsModalOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        {renderView()}
      </main>
      <AddTaskModal onAddTask={handleAddTask} />
    </div>
  );
}

export default App;
