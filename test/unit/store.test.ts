import { act } from 'react-dom/test-utils';
import { useStore } from '../../src/web/frontend/src/store';

describe('Store', () => {
    beforeEach(() => {
        // Reset the store to initial state
        const { setState } = useStore;
        setState({
            tasks: [],
            notifications: [],
            prompts: [],
            searchTerm: '',
            statusFilter: 'ALL',
            typeFilter: 'ALL',
            sortOption: 'priority-desc',
            theme: 'light',
            notificationsEnabled: true,
            searchInputRef: null,
            selectedTaskId: null,
        });
    });

    it('should initialize with default state', () => {
        const state = useStore.getState();
        
        expect(state.tasks).toEqual([]);
        expect(state.notifications).toEqual([]);
        expect(state.prompts).toEqual([]);
        expect(state.theme).toBe('light');
        expect(state.notificationsEnabled).toBe(true);
    });

    it('should add tasks correctly', () => {
        const task = {
            id: '1',
            type: 'REGULAR' as const,
            title: 'Test Task',
            description: 'Test Description',
            status: 'pending' as const,
            priority: 'medium' as const,
            completion_percentage: 0,
            parent_id: undefined,
            subtasks: [],
        };

        act(() => {
            useStore.getState().addTask(task);
        });

        const state = useStore.getState();
        expect(state.tasks).toHaveLength(1);
        expect(state.tasks[0]).toEqual(task);
    });

    it('should update tasks correctly', () => {
        const task = {
            id: '1',
            type: 'REGULAR' as const,
            title: 'Test Task',
            description: 'Test Description',
            status: 'pending' as const,
            priority: 'medium' as const,
            completion_percentage: 0,
            parent_id: undefined,
            subtasks: [],
        };

        act(() => {
            useStore.getState().addTask(task);
            useStore.getState().updateTask('1', { status: 'completed' });
        });

        const state = useStore.getState();
        expect(state.tasks[0].status).toBe('completed');
    });

    it('should filter pending prompts correctly', () => {
        const prompt = {
            id: '1',
            taskId: 'task1',
            message: 'Test prompt',
            type: 'text_input' as const,
            status: 'pending' as const,
            timestamp: Date.now(),
        };

        act(() => {
            useStore.getState().addPrompt(prompt);
        });

        const state = useStore.getState();
        const pendingPrompts = state.getPendingPrompts();
        
        expect(pendingPrompts).toHaveLength(1);
        expect(pendingPrompts[0]).toEqual(prompt);
    });

    it('should handle theme toggling', () => {
        const initialState = useStore.getState();
        expect(initialState.theme).toBe('light');

        act(() => {
            useStore.getState().toggleTheme();
        });

        const state = useStore.getState();
        expect(state.theme).toBe('dark');
    });
});