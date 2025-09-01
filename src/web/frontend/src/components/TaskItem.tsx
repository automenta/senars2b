import React, {memo, useMemo, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Task} from '../types';
import TaskList from './TaskList';
import TaskCard from './TaskCard';
import TaskControls from './TaskControls';
import TaskEditor from './TaskEditor';
import styles from './TaskItem.module.css';

interface TaskItemProps {
    task: Task;
    allFilteredTasks: Task[];
    sendMessage: (message: any) => void;
    isDraggable?: boolean;
    isSelected?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = memo(({
                                                    task,
                                                    allFilteredTasks,
                                                    sendMessage,
                                                    isDraggable = false,
                                                    isSelected = false
                                                }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDescription, setEditedDescription] = useState(task.description || '');
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const subtasks = useMemo(
        () => allFilteredTasks.filter(t => t.parent_id === task.id),
        [allFilteredTasks, task.id]
    );

    const hasSubtasks = subtasks.length > 0;

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasSubtasks) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleEditDetailed = () => {
        setIsEditorOpen(true);
    };

    const handleSave = (title: string, description: string) => {
        sendMessage({
            type: 'UPDATE_TASK',
            payload: {
                id: task.id,
                title,
                description,
            },
        });
        setIsEditing(false);
    };

    const handleSaveDetailed = (updatedTask: Task) => {
        sendMessage({
            type: 'UPDATE_TASK',
            payload: {
                id: updatedTask.id,
                title: updatedTask.title,
                description: updatedTask.description,
                priority: updatedTask.priority,
                status: updatedTask.status,
                type: updatedTask.type
            },
        });
    };

    const handleDelete = (taskId: string) => {
        sendMessage({
            type: 'DELETE_TASK',
            payload: {
                id: taskId
            },
        });
    };

    const handleCancelEdit = () => {
        setEditedTitle(task.title);
        setEditedDescription(task.description || '');
        setIsEditing(false);
    };

    return (
        <>
            <motion.div
                className={styles.container}
                layout
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, transition: {duration: 0.2}}}
                whileHover={{y: -2}}
                transition={{duration: 0.2}}
            >
                <TaskCard
                    task={task}
                    allFilteredTasks={allFilteredTasks}
                    isDraggable={isDraggable}
                    isSelected={isSelected}
                    isExpanded={isExpanded}
                    onToggleExpand={handleToggleExpand}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onCancelEdit={handleCancelEdit}
                    onTitleChange={setEditedTitle}
                    onDescriptionChange={setEditedDescription}
                    editedTitle={editedTitle}
                    editedDescription={editedDescription}
                    isEditing={isEditing}
                >
                    {!isEditing && (
                        <div className={styles.controlsContainer}>
                            <TaskControls
                                task={task}
                                sendMessage={sendMessage}
                                onEditDetailed={handleEditDetailed}
                            />
                        </div>
                    )}
                </TaskCard>
                <AnimatePresence>
                    {isExpanded && hasSubtasks && (
                        <motion.div
                            className={styles.subTaskContainer}
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            transition={{duration: 0.3}}
                        >
                            <TaskList tasks={subtasks} sendMessage={sendMessage} isSublist={true}/>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <TaskEditor
                task={task}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveDetailed}
                onDelete={handleDelete}
            />
        </>
    );
});

export default TaskItem;
