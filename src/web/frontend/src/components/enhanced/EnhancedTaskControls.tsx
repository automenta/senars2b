import React from 'react';
import {Task} from '../types';
import {
    FaCheck,
    FaPause,
    FaPlay,
    FaStop,
    FaTrash,
    FaEdit,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import styles from './EnhancedTaskControls.module.css';

interface EnhancedTaskControlsProps {
    task: Task;
    sendMessage: (msg: any) => void;
    onEditDetailed?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    showPriorityControls?: boolean;
}

const EnhancedTaskControls: React.FC<EnhancedTaskControlsProps> = ({
                                                                       task,
                                                                       sendMessage,
                                                                       onEditDetailed,
                                                                       onMoveUp,
                                                                       onMoveDown,
                                                                       showPriorityControls = false
                                                                   }) => {
    const handleComplete = () => sendMessage({type: 'COMPLETE_TASK', payload: {id: task.id}});
    const handlePause = () => sendMessage({type: 'PAUSE_AGENT', payload: {id: task.id}});
    const handleResume = () => sendMessage({type: 'RESUME_AGENT', payload: {id: task.id}});
    const handleStop = () => sendMessage({type: 'FAIL_TASK', payload: {id: task.id}});
    const handleDelete = () => sendMessage({type: 'DELETE_TASK', payload: {id: task.id}});

    const renderAgentControls = () => {
        const isPaused = task.status === 'DEFERRED' || task.status === 'PAUSED';
        return (
            <>
                {isPaused ? (
                    <button
                        onClick={handleResume}
                        title="Resume"
                        aria-label={`Resume task ${task.title}`}
                        className={`${styles.button} ${styles.resumeBtn}`}
                    >
                        <FaPlay/>
                    </button>
                ) : (
                    <button
                        onClick={handlePause}
                        title="Pause"
                        aria-label={`Pause task ${task.title}`}
                        className={`${styles.button} ${styles.pauseBtn}`}
                    >
                        <FaPause/>
                    </button>
                )}
                <button
                    onClick={handleStop}
                    title="Stop"
                    aria-label={`Stop task ${task.title}`}
                    className={`${styles.button} ${styles.stopBtn}`}
                >
                    <FaStop/>
                </button>
            </>
        );
    };

    const renderRegularControls = () => (
        <button
            onClick={handleComplete}
            title="Complete"
            aria-label={`Complete task ${task.title}`}
            className={`${styles.button} ${styles.completeBtn}`}
        >
            <FaCheck/>
        </button>
    );

    return (
        <div className={styles.controls}>
            {onEditDetailed && (
                <button
                    onClick={onEditDetailed}
                    title="Edit Detailed"
                    aria-label={`Edit task ${task.title} in detail`}
                    className={`${styles.button} ${styles.editBtn}`}
                >
                    <FaEdit/>
                </button>
            )}
            {showPriorityControls && onMoveUp && (
                <button
                    onClick={onMoveUp}
                    title="Move Up"
                    aria-label={`Move task ${task.title} up`}
                    className={`${styles.button} ${styles.priorityBtn}`}
                >
                    <FaArrowUp/>
                </button>
            )}
            {showPriorityControls && onMoveDown && (
                <button
                    onClick={onMoveDown}
                    title="Move Down"
                    aria-label={`Move task ${task.title} down`}
                    className={`${styles.button} ${styles.priorityBtn}`}
                >
                    <FaArrowDown/>
                </button>
            )}
            {task.type === 'AGENT' ? renderAgentControls() : renderRegularControls()}
            <button
                onClick={handleDelete}
                title="Delete"
                aria-label={`Delete task ${task.title}`}
                className={`${styles.button} ${styles.deleteBtn}`}
            >
                <FaTrash/>
            </button>
        </div>
    );
};

export default EnhancedTaskControls;