import React, {useCallback, useEffect, useMemo} from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import ProcessingView from './views/ProcessingView';
import TasksView from './views/TasksView';
import ConfigurationView from './views/ConfigurationView';
import CliView from './views/CliView';
import AddTaskModal from './components/AddTaskModal';
import {useWebSocket} from './hooks/useWebSocket';
import {useStore} from './store';
import {Task, TaskPriority} from './types';
import {useHotkeys} from './hooks/useHotkeys';
import {useNotifier} from './context/NotificationProvider';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error: Error) {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="error-boundary">Something went wrong. Please refresh the page.</div>;
        }

        return this.props.children;
    }
}

function App() {
    const {
        activeView,
        tasks,
        isModalOpen,
        theme,
        searchInputRef,
        setActiveView,
        setTasks,
        addTask,
        setIsModalOpen,
        toggleTheme,
    } = useStore();

    const {addNotification} = useNotifier();

    // Setup keyboard shortcuts
    useHotkeys({
        'n': () => setIsModalOpen(true),
        '/': () => searchInputRef?.current?.focus(),
    }, [searchInputRef]);

    // Handle WebSocket messages
    const handleMessage = useCallback((message: any) => {
        try {
            if (message.type === 'TASK_LIST_UPDATE') {
                const newTasks = message.payload.tasks;
                const tempId = message.payload.tempId;

                if (tempId) {
                    setTasks(
                        tasks.map(task =>
                            task.id === tempId ? newTasks.find((t: Task) => t.title === task.title) || task : task
                        )
                    );
                    addNotification('Task created successfully!', 'success');
                } else {
                    setTasks(newTasks);
                }
            } else if (message.type === 'TASK_UPDATE') {
                addNotification(`Task "${message.payload.title}" updated.`, 'info');
            } else if (message.type === 'TASK_DELETED') {
                addNotification(`Task deleted.`, 'error');
            } else if (message.type === 'ERROR') {
                addNotification(`Error: ${message.payload.message}`, 'error');
            } else if (message.type === 'WARNING') {
                addNotification(`Warning: ${message.payload.message}`, 'warning');
            } else if (message.type === 'STATS_UPDATE') {
                // Handle stats updates if needed
                console.log('Stats updated:', message.payload);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            addNotification('Error processing message from server', 'error');
        }
    }, [setTasks, tasks, addNotification]);

    const {isConnected, connectionError, sendMessage} = useWebSocket(handleMessage);

    // Notify user about connection status
    useEffect(() => {
        if (connectionError) {
            addNotification(`Connection error: ${connectionError}`, 'error');
        } else if (isConnected) {
            addNotification('Connected to server', 'success');
        } else {
            addNotification('Disconnected from server', 'warning');
        }
    }, [isConnected, connectionError, addNotification]);

    // Handle adding a new task
    const handleAddTask = useCallback((task: {
        title: string;
        description?: string;
        priority: TaskPriority,
        type: 'REGULAR' | 'AGENT'
    }) => {
        const tempId = `temp-${Date.now()}`;
        const newTask: Task = {
            id: tempId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            type: task.type,
            status: 'pending', // Use consistent status format
            completion_percentage: 0,
            parent_id: null,
            subtasks: [],
        };

        addTask(newTask);
        setIsModalOpen(false);

        // Send message to server with proper format
        sendMessage({
            type: 'ADD_TASK',
            payload: {
                title: task.title,
                description: task.description,
                priority_level: task.priority,
                type: task.type === 'AGENT' ? 'AGENT' : 'REGULAR',
                tempId: tempId,
            }
        });
    }, [addTask, setIsModalOpen, sendMessage]);

    // Memoize view rendering for performance
    const renderView = useMemo(() => {
        switch (activeView) {
            case 'Dashboard':
                return <DashboardView/>;
            case 'Processing':
                return <ProcessingView/>;
            case 'Tasks':
                return <TasksView sendMessage={sendMessage}/>;
            case 'Configuration':
                return <ConfigurationView/>;
            case 'CLI':
                return <CliView/>;
            default:
                return <DashboardView/>;
        }
    }, [activeView, sendMessage]);

    return (
        <ErrorBoundary>
            <div className="app-container">
                <Sidebar activeView={activeView} onSelectView={setActiveView}/>
                <main className="main-content">
                    <Header
                        title={activeView}
                        onAddTask={() => setIsModalOpen(true)}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        isConnected={isConnected}
                    />
                    {renderView}
                </main>
                {isModalOpen && <AddTaskModal onAddTask={handleAddTask}/>}
            </div>
        </ErrorBoundary>
    );
}

export default App;
