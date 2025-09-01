import React, {useState, useCallback, useMemo} from 'react';
import {Task} from '../../types';
import EnhancedTaskEntity from './EnhancedTaskEntity';
import styles from './TaskCollection.module.css';
import {crdtTaskManager} from '../../crdtTaskManager';

interface TaskCollectionProps {
    tasks: Task[];
    selectedTaskId: string | null;
    onTaskSelect: (taskId: string | null) => void;
    onTaskEditStart: (taskId: string) => void;
    onTaskEditEnd: (taskId: string) => void;
}

const TaskCollection: React.FC<TaskCollectionProps> = ({
                                                           tasks,
                                                           selectedTaskId,
                                                           onTaskSelect,
                                                           onTaskEditStart,
                                                           onTaskEditEnd
                                                       }) => {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    // Group tasks by parent ID to identify subtasks
    const taskHierarchy = useMemo(() => {
        const hierarchy: Record<string, Task[]> = {};
        tasks.forEach(task => {
            const parentId = task.parent_id || 'root';
            if (!hierarchy[parentId]) {
                hierarchy[parentId] = [];
            }
            hierarchy[parentId].push(task);
        });
        return hierarchy;
    }, [tasks]);

    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetTaskId: string) => {
        e.preventDefault();
        if (!draggedTaskId || draggedTaskId === targetTaskId) return;

        // Find the tasks to reorder
        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        const targetTask = tasks.find(t => t.id === targetTaskId);

        if (!draggedTask || !targetTask) return;

        // If both tasks have the same parent, reorder within that parent
        if (draggedTask.parent_id === targetTask.parent_id) {
            const parentId = draggedTask.parent_id || 'root';
            const siblings = taskHierarchy[parentId] || [];

            // Create new order
            const newOrder = [...siblings];
            const draggedIndex = newOrder.findIndex(t => t.id === draggedTaskId);
            const targetIndex = newOrder.findIndex(t => t.id === targetTaskId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [removed] = newOrder.splice(draggedIndex, 1);
                newOrder.splice(targetIndex, 0, removed);

                // Update order in CRDT
                const orderedIds = newOrder.map(t => t.id);
                if (parentId === 'root') {
                    crdtTaskManager.reorderTasks(orderedIds);
                } else {
                    // For subtasks, we would need a different approach
                    // This is a simplified implementation
                    console.log('Reordering subtasks:', parentId, orderedIds);
                }
            }
        }

        setDraggedTaskId(null);
    }, [draggedTaskId, tasks, taskHierarchy]);

    const handleReorder = useCallback((taskId: string, direction: 'up' | 'down') => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const parentId = task.parent_id || 'root';
        const siblings = taskHierarchy[parentId] || [];
        const currentIndex = siblings.findIndex(t => t.id === taskId);

        if (currentIndex === -1) return;

        let newIndex;
        if (direction === 'up') {
            newIndex = Math.max(0, currentIndex - 1);
        } else {
            newIndex = Math.min(siblings.length - 1, currentIndex + 1);
        }

        if (newIndex !== currentIndex) {
            const newOrder = [...siblings];
            const [removed] = newOrder.splice(currentIndex, 1);
            newOrder.splice(newIndex, 0, removed);

            // Update order in CRDT
            const orderedIds = newOrder.map(t => t.id);
            if (parentId === 'root') {
                crdtTaskManager.reorderTasks(orderedIds);
            } else {
                // For subtasks, we would need a different approach
                // This is a simplified implementation
                console.log('Reordering subtasks:', parentId, orderedIds);
            }
        }
    }, [tasks, taskHierarchy]);

    const handleToggleExpand = useCallback((taskId: string) => {
        setExpandedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    }, []);

    const handleCloneTask = useCallback((taskToClone: Task) => {
        // Create a new task with similar properties but a new ID
        const newTask: Task = {
            ...taskToClone,
            id: `task-${Date.now()}`, // Generate new ID
            title: `${taskToClone.title} (Copy)`,
            parent_id: undefined, // Remove parent relationship for cloned task
            subtasks: [], // Reset subtasks
            created_at: Date.now(),
            updated_at: Date.now()
        };

        // Add to CRDT store
        crdtTaskManager.addTask(newTask);
    }, []);

    const renderTask = useCallback((task: Task, depth: number = 0) => {
        const isEditing = editingTaskId === task.id;
        const isSelected = selectedTaskId === task.id;
        const isExpanded = expandedTaskIds.has(task.id);
        const hasSubtasks = taskHierarchy[task.id] && taskHierarchy[task.id].length > 0;

        return (
            <div
                key={task.id}
                className={styles.taskWrapper}
                style={{marginLeft: depth > 0 ? `${depth * 20}px` : '0'}}
            >
                <EnhancedTaskEntity
                    task={task}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    isDraggable={true}
                    hasSubtasks={!!hasSubtasks}
                    isExpanded={isExpanded}
                    onEditStart={onTaskEditStart}
                    onEditEnd={onTaskEditEnd}
                    onToggleSelect={onTaskSelect}
                    onToggleExpand={handleToggleExpand}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onReorder={handleReorder}
                    onClone={handleCloneTask}
                />
                {isExpanded && hasSubtasks && (
                    <div className={styles.subtasksContainer}>
                        {taskHierarchy[task.id]?.map(subtask => renderTask(subtask, depth + 1))}
                    </div>
                )}
            </div>
        );
    }, [
        editingTaskId,
        selectedTaskId,
        expandedTaskIds,
        taskHierarchy,
        onTaskEditStart,
        onTaskEditEnd,
        onTaskSelect,
        handleToggleExpand,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleReorder,
        handleCloneTask
    ]);

    // Render only root tasks (those without a parent)
    const rootTasks = taskHierarchy['root'] || [];

    return (
        <div className={styles.taskCollection}>
            {rootTasks.map(task => renderTask(task))}
        </div>
    );
};

export default TaskCollection;