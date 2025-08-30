import React, {useCallback, useEffect} from 'react';
import Header from './components/Header';
import TasksView from './views/TasksView';
import {useWebSocket} from './hooks/useWebSocket';
import {useStore} from './store';
import CommandBar from "./components/CommandBar";
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
        tasks,
        theme,
        searchInputRef,
        setTasks,
        addTask,
        toggleTheme,
        addPrompt,
        addNotification,
    } = useStore();

    const {addNotification: addToastNotification} = useNotifier();

    // Setup keyboard shortcuts
    useHotkeys({
        // 'n' is now free, could be used for 'new task' focus
        '/': () => searchInputRef?.current?.focus(),
    }, [searchInputRef]);

    // Handle WebSocket messages
    const handleMessage = useCallback((message: any) => {
        try {
            switch (message.type) {
                case 'TASK_LIST_UPDATE': {
                    const newTasks = message.payload.tasks;
                    const tempId = message.payload.tempId;
                    if (tempId) {
                        setTasks(
                            tasks.map(task =>
                                task.id === tempId ? newTasks.find((t: Task) => t.title === task.title) || task : task
                            )
                        );
                        addToastNotification('Task created successfully!', 'success');
                    } else {
                        setTasks(newTasks);
                    }
                    break;
                }
                case 'TASK_UPDATE':
                    addToastNotification(`Task "${message.payload.title}" updated.`, 'info');
                    break;
                case 'TASK_DELETED':
                    addToastNotification(`Task deleted.`, 'error');
                    break;
                case 'ERROR':
                    addToastNotification(`Error: ${message.payload.message}`, 'error');
                    break;
                case 'WARNING':
                    addToastNotification(`Warning: ${message.payload.message}`, 'warning');
                    break;
                case 'PROMPT_NEW':
                    addPrompt(message.payload);
                    addToastNotification('You have a new prompt in your inbox!', 'info');
                    break;
                case 'NOTIFICATION':
                    addNotification(message.payload);
                    break;
                case 'STATS_UPDATE':
                    // This is handled by the useDashboardStats hook now
                    break;
                default:
                    // console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            addToastNotification('Error processing message from server', 'error');
        }
    }, [setTasks, tasks, addToastNotification, addPrompt, addNotification]);

    const {isConnected, connectionError, sendMessage} = useWebSocket(handleMessage);

    // Notify user about connection status
    useEffect(() => {
        if (connectionError) {
            addToastNotification(`Connection error: ${connectionError}`, 'error');
        } else if (isConnected) {
            addToastNotification('Connected to server', 'success');
        } else {
            addToastNotification('Disconnected from server', 'warning');
        }
    }, [isConnected, connectionError, addToastNotification]);

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
    }, [addTask, sendMessage]);

    return (
        <ErrorBoundary>
            <div className="app-container">
                <main className="main-content">
                    <Header
                        theme={theme}
                        toggleTheme={toggleTheme}
                        isConnected={isConnected}
                        onNavigate={(view) => alert(`Would navigate to ${view}`)}
                    />
                    <TasksView
                        sendMessage={sendMessage}
                        onAddTask={handleAddTask}
                    />
                </main>
                <CommandBar/>
            </div>
        </ErrorBoundary>
    );
}

export default App;
