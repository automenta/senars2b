import React, {memo, useCallback, useState, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Task} from '../types';
import TaskItem from './TaskItem';
import styles from './EnhancedTaskList.module.css';

interface EnhancedTaskListProps {
    tasks: Task[];
    sendMessage: (message: any) => void;
    isSublist?: boolean;
    selectedTaskIndex?: number;
}

const EnhancedTaskList: React.FC<EnhancedTaskListProps> = memo(({
                                                                    tasks,
                                                                    sendMessage,
                                                                    isSublist = false,
                                                                    selectedTaskIndex = -1
                                                                }) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const dropTargetId = useRef<string | null>(null);

    // For main list, we need to filter out subtasks
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const tasksToRender = isSublist
        ? tasks
        : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id));

    const listClassName = `${styles.taskList} ${isSublist ? styles.subTaskList : ''}`;

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

        // For sublists, we reorder subtasks
        if (isSublist) {
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
        }
        // For main list, we reorder tasks
        else {
            const draggedIndex = tasksToRender.findIndex(t => t.id === draggedItemId);
            const targetIndex = tasksToRender.findIndex(t => t.id === dropTargetId.current);

            if (draggedIndex === -1 || targetIndex === -1) return;

            const newOrder = [...tasksToRender];
            const [draggedItem] = newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, draggedItem);

            // TODO: Implement reordering for main task list
            // This would require a new message type like 'REORDER_TASKS'
            console.log('Reordering main task list:', newOrder.map(t => t.id));
            // sendMessage({
            //     type: 'REORDER_TASKS',
            //     payload: {
            //         orderedTaskIds: newOrder.map(t => t.id),
            //     },
            // });
        }

        setDraggedItemId(null);
        dropTargetId.current = null;
    }, [draggedItemId, isSublist, sendMessage, tasks, tasksToRender]);

    // Memoize task item rendering
    const renderTaskItem = useCallback((task: Task, index: number) => (
        <motion.div
            key={task.id}
            className={`${styles.taskListItem} ${draggedItemId === task.id ? styles.dragging : ''}`}
            draggable={true} // Always draggable for enhanced list
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.3, delay: index * 0.05}}
            whileHover={!isSublist ? {y: -5} : {}}
        >
            <TaskItem
                task={task}
                allFilteredTasks={tasks}
                sendMessage={sendMessage}
                isDraggable={true} // Always show drag handle for enhanced list
                isSelected={!isSublist && index === selectedTaskIndex}
            />
        </motion.div>
    ), [draggedItemId, handleDragOver, handleDragStart, isSublist, selectedTaskIndex, sendMessage, tasks]);

    return (
        <motion.div
            className={listClassName}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            data-testid="enhanced-task-list"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
            <AnimatePresence>
                {tasksToRender.map((task, index) => renderTaskItem(task, index))}
            </AnimatePresence>
        </motion.div>
    );
});

export default EnhancedTaskList;