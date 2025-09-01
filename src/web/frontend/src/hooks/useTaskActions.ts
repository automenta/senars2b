import {useCallback} from 'react';
import {crdtTaskManager} from '../crdtTaskManager';

export const useTaskActions = () => {
    const updateTask = useCallback((taskId: string, updates: any) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(taskId, updates);
    }, []);

    const deleteTask = useCallback((taskId: string) => {
        // Delete via CRDT manager for proper synchronization
        crdtTaskManager.removeTask(taskId);
    }, []);

    const completeTask = useCallback((taskId: string) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(taskId, {status: 'completed'});
    }, []);

    const pauseTask = useCallback((taskId: string) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(taskId, {status: 'paused'});
    }, []);

    const resumeTask = useCallback((taskId: string) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(taskId, {status: 'pending'});
    }, []);

    const failTask = useCallback((taskId: string) => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(taskId, {status: 'failed'});
    }, []);

    return {
        updateTask,
        deleteTask,
        completeTask,
        pauseTask,
        resumeTask,
        failTask
    };
};