import {useCallback, useEffect, useRef} from 'react';

interface UseTaskNavigationOptions {
    onSelect?: (taskId: string) => void;
    onEdit?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
    onComplete?: (taskId: string) => void;
    onMoveUp?: (taskId: string) => void;
    onMoveDown?: (taskId: string) => void;
}

export const useTaskNavigation = (
    taskIds: string[],
    selectedTaskId: string | null,
    options: UseTaskNavigationOptions = {}
) => {
    const {
        onSelect,
        onEdit,
        onDelete,
        onComplete,
        onMoveUp,
        onMoveDown
    } = options;

    const selectedIndexRef = useRef<number>(-1);

    // Update selected index ref when selectedTaskId changes
    useEffect(() => {
        if (selectedTaskId) {
            const index = taskIds.indexOf(selectedTaskId);
            selectedIndexRef.current = index;
        } else {
            selectedIndexRef.current = -1;
        }
    }, [selectedTaskId, taskIds]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle keys if we have tasks
        if (taskIds.length === 0) return;

        const currentIndex = selectedIndexRef.current;
        const currentTaskId = currentIndex >= 0 ? taskIds[currentIndex] : null;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    selectedIndexRef.current = currentIndex - 1;
                    onSelect?.(taskIds[selectedIndexRef.current]);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < taskIds.length - 1) {
                    selectedIndexRef.current = currentIndex + 1;
                    onSelect?.(taskIds[selectedIndexRef.current]);
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (currentTaskId) {
                    onSelect?.(currentTaskId);
                }
                break;

            case 'e':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (currentTaskId) {
                        onEdit?.(currentTaskId);
                    }
                }
                break;

            case 'Delete':
            case 'Backspace':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (currentTaskId) {
                        onDelete?.(currentTaskId);
                    }
                }
                break;

            case ' ':
                e.preventDefault();
                if (currentTaskId) {
                    onComplete?.(currentTaskId);
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (currentTaskId) {
                    onMoveUp?.(currentTaskId);
                }
                break;

            case 'ArrowRight':
                e.preventDefault();
                if (currentTaskId) {
                    onMoveDown?.(currentTaskId);
                }
                break;

            default:
                break;
        }
    }, [taskIds, onSelect, onEdit, onDelete, onComplete, onMoveUp, onMoveDown]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Return helper functions
    const selectTask = useCallback((id: string) => {
        const index = taskIds.indexOf(id);
        if (index >= 0) {
            selectedIndexRef.current = index;
            onSelect?.(id);
        }
    }, [taskIds, onSelect]);

    const selectFirst = useCallback(() => {
        if (taskIds.length > 0) {
            selectedIndexRef.current = 0;
            onSelect?.(taskIds[0]);
        }
    }, [taskIds, onSelect]);

    const selectLast = useCallback(() => {
        if (taskIds.length > 0) {
            selectedIndexRef.current = taskIds.length - 1;
            onSelect?.(taskIds[taskIds.length - 1]);
        }
    }, [taskIds, onSelect]);

    return {
        selectedIndex: selectedIndexRef.current,
        selectTask,
        selectFirst,
        selectLast
    };
};