import React, {useCallback, useState} from 'react';
import {useTasks} from '../hooks/useTasks';
import {useStore} from '../store';
import TaskBoard from './task/TaskBoard';
import TaskEditor from './task/TaskEditor';
import {Task} from '../types';
import styles from './TaskDashboard.module.css';

const TaskDashboard: React.FC = () => {
    const {tasks} = useTasks();
    const {addTask, updateTask} = useStore();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    const handleAddTask = useCallback(() => {
        setEditingTask(undefined);
        setIsEditorOpen(true);
    }, []);

    const handleEditTask = useCallback((task: Task) => {
        setEditingTask(task);
        setIsEditorOpen(true);
    }, []);

    const handleSaveTask = useCallback((taskData: Partial<Task>) => {
        if (editingTask) {
            // Update existing task
            updateTask(editingTask.id, taskData);
        } else {
            // Create new task
            const newTask: Task = {
                id: `task-${Date.now()}`,
                title: taskData.title || 'New Task',
                description: taskData.description,
                status: taskData.status || 'pending',
                priority: taskData.priority || 'medium',
                type: 'REGULAR',
                subtasks: [],
                creation_time: Date.now()
            };
            addTask(newTask);
        }
        setIsEditorOpen(false);
    }, [editingTask, addTask, updateTask]);

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h1>Task Dashboard</h1>
                <button
                    className={styles.addButton}
                    onClick={handleAddTask}
                >
                    + Add Task
                </button>
            </div>

            <TaskBoard
                tasks={tasks}
                className={styles.taskBoard}
            />

            <TaskEditor
                task={editingTask}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveTask}
            />
        </div>
    );
};

export default TaskDashboard;