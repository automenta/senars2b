import React, { useRef, useState, memo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import TaskItem from './TaskItem';
import styles from './TaskList.module.css';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface TaskListProps {
    tasks: Task[];
    sendMessage: (message: any) => void;
    isSublist?: boolean;
    selectedTaskIndex?: number;
}

const TaskList: React.FC<TaskListProps> = memo(({ tasks, sendMessage, isSublist = false, selectedTaskIndex = -1 }) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const dropTargetId = useRef<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const tasksToRender = isSublist
        ? tasks
        : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id));

    const listClassName = `${styles.taskList} ${isSublist ? styles.subTaskList : ''}`;

    // Setup keyboard navigation
    const { selectedIndex, selectItem, selectFirst, selectLast } = useKeyboardNavigation(
        tasksToRender.map(t => t.id),
        selectedTaskId,
        {
            enableArrowNavigation: !isSublist,
            enableSelection: !isSublist,
            enableExpansion: !isSublist,
            onUp: () => {
                // Handle up arrow navigation
            },
            onDown: () => {
                // Handle down arrow navigation
            },
            onSelect: () => {
                // Handle task selection
                if (selectedIndex >= 0 && selectedIndex < tasksToRender.length) {
                    const task = tasksToRender[selectedIndex];
                    setSelectedTaskId(task.id);
                }
            },
            onExpand: () => {
                // Handle task expansion
            },
            onCollapse: () => {
                // Handle task collapse
            }
        }
    );

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        if (id !== draggedItemId) {
            dropTargetId.current = id;
        }
    }, [draggedItemId]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!draggedItemId || !dropTargetId.current) return;

        const parentId = tasks.find(t => t.id === draggedItemId)?.parent_id;
        if (!parentId) return;

        const subtasks = tasks.filter(t => t.parent_id === parentId);
        const draggedIndex = subtasks.findIndex(t => t.id === draggedItemId);
        const targetIndex = subtasks.findIndex(t => t.id === dropTargetId.current);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newOrder = [...subtasks];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);

        sendMessage({
            type: 'REORDER_SUBTASKS',
            payload: {
                parentId: parentId,
                orderedSubtaskIds: newOrder.map(t => t.id),
            },
        });

        setDraggedItemId(null);
        dropTargetId.current = null;
    }, [draggedItemId, sendMessage, tasks]);

    // Memoize task item rendering
    const renderTaskItem = useCallback((task: Task, index: number) => (
        <div
            key={task.id}
            className={`${styles.taskListItem} ${draggedItemId === task.id ? styles.dragging : ''}`}
            draggable={isSublist}
            onDragStart={isSublist ? (e) => handleDragStart(e, task.id) : undefined}
            onDragOver={isSublist ? (e) => handleDragOver(e, task.id) : undefined}
        >
            <TaskItem
                task={task}
                allFilteredTasks={tasks}
                sendMessage={sendMessage}
                isDraggable={isSublist}
                isSelected={!isSublist && index === selectedTaskIndex}
            />
        </div>
    ), [draggedItemId, handleDragOver, handleDragStart, isSublist, selectedTaskIndex, sendMessage, tasks]);

    return (
        <div 
            className={listClassName} 
            onDragOver={isSublist ? e => e.preventDefault() : undefined}
            onDrop={isSublist ? handleDrop : undefined}
        >
            <AnimatePresence>
                {tasksToRender.map((task, index) => renderTaskItem(task, index))}
            </AnimatePresence>
        </div>
    );
});

export default TaskList;
