import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaskCard } from './components/task/TaskCard';
import { TaskBoard } from './components/task/TaskBoard';
import { TaskPrioritization } from './components/task/TaskPrioritization';
import { TaskTimeline } from './components/task/TaskTimeline';
import { PriorityGroups } from './components/task/PriorityGroups';
import { AdvancedSearch } from './components/task/AdvancedSearch';
import { TaskAnalytics } from './components/task/TaskAnalytics';
import { ViewSwitcher } from './components/ViewSwitcher';
import { BulkTaskActions } from './components/BulkTaskActions';
import { InlineAddTaskForm } from './components/InlineAddTaskForm';
import { StatusBadge } from './components/StatusBadge';
import { PriorityBadge } from './components/PriorityBadge';
import { ProgressBar } from './components/ProgressBar';
import { DashboardPanel } from './components/DashboardPanel';

// This is a demonstration of how the components would be used in a React application
const App = () => {
  // Sample task data
  const sampleTasks = [
    {
      id: '1',
      title: 'Review new UI design',
      description: 'Review the new user interface design and provide feedback on usability improvements.',
      status: 'pending',
      type: 'REGULAR',
      priority: 'medium',
      completion_percentage: 45,
      created_at: Date.now() - 86400000,
      updated_at: Date.now() - 43200000
    },
    {
      id: '2',
      title: 'Implement WebSocket connection',
      description: 'Set up WebSocket connection for real-time task updates.',
      status: 'pending',
      type: 'REGULAR',
      priority: 'low',
      completion_percentage: 20,
      created_at: Date.now() - 172800000,
      updated_at: Date.now() - 86400000
    },
    {
      id: '3',
      title: 'Update documentation',
      description: 'Update user documentation with new features.',
      status: 'pending',
      type: 'REGULAR',
      priority: 'medium',
      completion_percentage: 0,
      created_at: Date.now() - 259200000,
      updated_at: Date.now() - 172800000
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Senars3 UI Components Demo</h1>
      
      <h2>Task Card</h2>
      <TaskCard 
        task={sampleTasks[0]}
        isSelected={false}
        isExpanded={false}
        onToggleSelect={() => {}}
        onToggleExpand={() => {}}
        sendMessage={() => {}}
      />
      
      <h2>Status Badge</h2>
      <StatusBadge status="pending" />
      
      <h2>Priority Badge</h2>
      <PriorityBadge priority="critical" />
      
      <h2>Progress Bar</h2>
      <ProgressBar percentage={75} />
      
      <h2>View Switcher</h2>
      <ViewSwitcher 
        currentView="list" 
        onViewChange={() => {}} 
      />
      
      <h2>Inline Add Task Form</h2>
      <InlineAddTaskForm 
        onAddTask={() => {}} 
        onCancel={() => {}} 
      />
    </div>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);