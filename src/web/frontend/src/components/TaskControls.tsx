import React from 'react';
import {Task} from '../types';
import {FaCheck, FaEdit, FaPause, FaPlay, FaStop, FaTrash} from 'react-icons/fa';
import styles from './TaskControls.module.css';

interface TaskControlsProps {
    task: Task;
    sendMessage: (msg: any) => void;
}

const TaskControls: React.FC<TaskControlsProps> = ({task, sendMessage}) => {
    const handleComplete = () => sendMessage({type: 'COMPLETE_TASK', payload: {id: task.id}});
    const handlePause = () => sendMessage({type: 'PAUSE_AGENT', payload: {id: task.id}});
    const handleResume = () => sendMessage({type: 'RESUME_AGENT', payload: {id: task.id}});
    const handleStop = () => sendMessage({type: 'FAIL_TASK', payload: {id: task.id}});
    const handleDelete = () => sendMessage({type: 'DELETE_TASK', payload: {id: task.id}});
    const handleEdit = () => {
        // TODO: Implement edit functionality
        console.log('Edit task:', task.id);
    };

    const renderAgentControls = () => {
        const isPaused = task.status === 'DEFERRED' || task.status === 'PAUSED';
        return (
            <>
                {isPaused ? (
                    <button onClick={handleResume} title="Resume" aria-label={`Resume task ${task.title}`}
                            className={`${styles.button} ${styles.resumeBtn}`}><FaPlay/></button>
                ) : (
                    <button onClick={handlePause} title="Pause" aria-label={`Pause task ${task.title}`}
                            className={`${styles.button} ${styles.pauseBtn}`}><FaPause/></button>
                )}
                <button onClick={handleStop} title="Stop" aria-label={`Stop task ${task.title}`}
                        className={`${styles.button} ${styles.stopBtn}`}><FaStop/></button>
            </>
        );
    };

    const renderRegularControls = () => (
        <button onClick={handleComplete} title="Complete" aria-label={`Complete task ${task.title}`}
                className={`${styles.button} ${styles.completeBtn}`}><FaCheck/></button>
    );

    return (
        <div className={styles.controls}>
            {task.type === 'AGENT' ? renderAgentControls() : renderRegularControls()}
            <button onClick={handleEdit} title="Edit" aria-label={`Edit task ${task.title}`}
                    className={`${styles.button} ${styles.editBtn}`}><FaEdit/></button>
            <button onClick={handleDelete} title="Delete" aria-label={`Delete task ${task.title}`}
                    className={`${styles.button} ${styles.deleteBtn}`}><FaTrash/></button>
        </div>
    );
};

export default TaskControls;
