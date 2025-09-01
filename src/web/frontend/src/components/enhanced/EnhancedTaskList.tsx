import React, {memo, useCallback, useState, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Task} from '../../types';
import EnhancedTaskCard from './EnhancedTaskCard';
import styles from './EnhancedTaskList.module.css';
import {useKeyboardNavigation} from '../../hooks/useKeyboardNavigation';

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
    const dropTargetId = React.useRef<string | null>(null);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
    const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});

    // For main list, we need to filter out subtasks
    const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
    const tasksToRender = useMemo(() =>
            isSublist
                ? tasks
                : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id)),
        [isSublist, tasks, taskMap]
    );

    const listClassName = `${styles.taskList} ${isSublist ? styles.subTaskList : ''}`;

    // Setup keyboard navigation
    const {selectedIndex, selectItem, selectFirst, selectLast} = useKeyboardNavigation(
        tasksToRender.map(t => t.id),
        selectedTaskIndex >= 0 ? tasksToRender[selectedTaskIndex]?.id : null,
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
                    // TODO: Implement task selection
                }
            },
            onExpand: () => {
                // Handle task expansion
                if (selectedIndex >= 0 && selectedIndex < tasksToRender.length) {
                    const task = tasksToRender[selectedIndex];
                    // TODO: Implement task expansion
                }
            },
            onCollapse: () => {
                // Handle task collapse
                if (selectedIndex >= 0 && selectedIndex < tasksToRender.length) {
                    const task = tasksToRender[selectedIndex];
                    // TODO: Implement task collapse
                }
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

    const handleToggleExpand = useCallback((taskId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: Implement expand/collapse logic
        console.log('Toggle expand for task:', taskId);
    }, []);

    const handleEdit = useCallback((taskId: string) => () => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setEditingTaskId(taskId);
            setEditedTitles(prev => ({...prev, [taskId]: task.title}));
            setEditedDescriptions(prev => ({...prev, [taskId]: task.description || ''}));
        }
    }, [tasks]);

    const handleSave = useCallback((taskId: string) => (title: string, description: string) => {
        sendMessage({
            type: 'UPDATE_TASK',
            payload: {
                id: taskId,
                title,
                description,
            },
        });
        setEditingTaskId(null);
    }, [sendMessage]);

    const handleCancelEdit = useCallback((taskId: string) => () => {
        setEditingTaskId(null);
        setEditedTitles(prev => {
            const newTitles = {...prev};
            delete newTitles[taskId];
            return newTitles;
        });
        setEditedDescriptions(prev => {
            const newDescriptions = {...prev};
            delete newDescriptions[taskId];
            return newDescriptions;
        });
    }, []);

    const handleTitleChange = useCallback((taskId: string) => (title: string) => {
        setEditedTitles(prev => ({...prev, [taskId]: title}));
    }, []);

    const handleDescriptionChange = useCallback((taskId: string) => (description: string) => {
        setEditedDescriptions(prev => ({...prev, [taskId]: description}));
    }, []);

    const handleDelete = useCallback((taskId: string) => {
        sendMessage({
            type: 'DELETE_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleComplete = useCallback((taskId: string) => {
        sendMessage({
            type: 'COMPLETE_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handlePause = useCallback((taskId: string) => {
        sendMessage({
            type: 'PAUSE_AGENT',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleResume = useCallback((taskId: string) => {
        sendMessage({
            type: 'RESUME_AGENT',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleStop = useCallback((taskId: string) => {
        sendMessage({
            type: 'FAIL_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

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
            <EnhancedTaskCard
                task={task}
                allFilteredTasks={tasks}
                isDraggable={true} // Always show drag handle for enhanced list
                isSelected={!isSublist && index === selectedTaskIndex}
                isExpanded={false} // TODO: Implement expansion state
                onToggleExpand={handleToggleExpand(task.id)}
                onEdit={handleEdit(task.id)}
                onSave={handleSave(task.id)}
                onCancelEdit={handleCancelEdit(task.id)}
                onDelete={() => handleDelete(task.id)}
                onComplete={() => handleComplete(task.id)}
                onPause={() => handlePause(task.id)}
                onResume={() => handleResume(task.id)}
                onStop={() => handleStop(task.id)}
                onTitleChange={handleTitleChange(task.id)}
                onDescriptionChange={handleDescriptionChange(task.id)}
                editedTitle={editedTitles[task.id] || task.title}
                editedDescription={editedDescriptions[task.id] || task.description || ''}
                isEditing={editingTaskId === task.id}
            />
        </motion.div>
    ), [
        draggedItemId,
        handleDragOver,
        handleDragStart,
        isSublist,
        selectedTaskIndex,
        tasks,
        handleToggleExpand,
        handleEdit,
        handleSave,
        handleCancelEdit,
        handleDelete,
        handleComplete,
        handlePause,
        handleResume,
        handleStop,
        handleTitleChange,
        handleDescriptionChange,
        editedTitles,
        editedDescriptions,
        editingTaskId
    ]);

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