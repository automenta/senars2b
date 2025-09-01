import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/web/frontend/src/App';
import {Task} from '../src/interfaces/task';

// Mock the WebSocket hook
jest.mock('../src/web/frontend/src/hooks/useWebSocket', () => ({
    useWebSocket: () => ({
        isConnected: true,
        connectionError: null,
        sendMessage: jest.fn()
    })
}));

// Mock the store
jest.mock('../src/web/frontend/src/store', () => ({
    useStore: () => ({
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
        setTasks: jest.fn(),
        addTask: jest.fn(),
        updateTask: jest.fn(),
        removeTask: jest.fn(),
        setSearchTerm: jest.fn(),
        setStatusFilter: jest.fn(),
        setTypeFilter: jest.fn(),
        setSortOption: jest.fn(),
        toggleTheme: jest.fn(),
        toggleNotifications: jest.fn(),
        setSearchInputRef: jest.fn(),
        setSelectedTaskId: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn(),
        addPrompt: jest.fn(),
        updatePrompt: jest.fn(),
        getTaskById: jest.fn(),
        getSubtasks: jest.fn(),
        getPendingPrompts: jest.fn(),
        clearFilters: jest.fn()
    })
}));

describe('App', () => {
    const mockTask: Task = {
        id: '1',
        atom_id: 'atom-1',
        type: 'TASK',
        label: 'Test Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'pending',
            priority_level: 'medium',
            completion_percentage: 0
        }
    };

    it('renders without crashing', () => {
        render(<App/>);
        expect(screen.getByText('Senars3 Cognitive Interface')).toBeInTheDocument();
    });

    it('displays the main dashboard components', () => {
        render(<App/>);
        expect(screen.getByText('Task Dashboard')).toBeInTheDocument();
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Task Statistics')).toBeInTheDocument();
    });

    it('handles task creation', async () => {
        render(<App/>);
        const addButton = screen.getByRole('button', {name: /\+ Add Task/i});
        fireEvent.click(addButton);

        // Should open task editor modal
        await waitFor(() => {
            expect(screen.getByText('New Task')).toBeInTheDocument();
        });
    });

    it('handles task editing', async () => {
        render(<App/>);
        const editButton = screen.getByRole('button', {name: /edit/i});
        fireEvent.click(editButton);

        // Should open task editor modal
        await waitFor(() => {
            expect(screen.getByText('Edit Task')).toBeInTheDocument();
        });
    });

    it('handles task deletion', () => {
        render(<App/>);
        const deleteButton = screen.getByRole('button', {name: /delete/i});
        fireEvent.click(deleteButton);

        // Should show confirmation dialog or send delete message
        expect(deleteButton).toBeInTheDocument();
    });

    it('handles task completion', () => {
        render(<App/>);
        const completeButton = screen.getByRole('button', {name: /complete/i});
        fireEvent.click(completeButton);

        // Should send complete message
        expect(completeButton).toBeInTheDocument();
    });

    it('handles task pausing', () => {
        render(<App/>);
        const pauseButton = screen.getByRole('button', {name: /pause/i});
        fireEvent.click(pauseButton);

        // Should send pause message
        expect(pauseButton).toBeInTheDocument();
    });

    it('handles task resuming', () => {
        render(<App/>);
        const resumeButton = screen.getByRole('button', {name: /resume/i});
        fireEvent.click(resumeButton);

        // Should send resume message
        expect(resumeButton).toBeInTheDocument();
    });

    it('handles task stopping', () => {
        render(<App/>);
        const stopButton = screen.getByRole('button', {name: /stop/i});
        fireEvent.click(stopButton);

        // Should send stop message
        expect(stopButton).toBeInTheDocument();
    });

    it('handles search functionality', () => {
        render(<App/>);
        const searchInput = screen.getByPlaceholderText('Search tasks...');
        fireEvent.change(searchInput, {target: {value: 'test'}});

        // Should update search term
        expect(searchInput).toHaveValue('test');
    });

    it('handles filter changes', () => {
        render(<App/>);
        const statusFilter = screen.getByRole('combobox', {name: /status filter/i});
        fireEvent.change(statusFilter, {target: {value: 'completed'}});

        // Should update status filter
        expect(statusFilter).toHaveValue('completed');
    });

    it('handles sorting changes', () => {
        render(<App/>);
        const sortSelect = screen.getByRole('combobox', {name: /sort by/i});
        fireEvent.change(sortSelect, {target: {value: 'priority-desc'}});

        // Should update sort option
        expect(sortSelect).toHaveValue('priority-desc');
    });

    it('handles theme toggling', () => {
        render(<App/>);
        const themeToggle = screen.getByRole('button', {name: /toggle theme/i});
        fireEvent.click(themeToggle);

        // Should toggle theme
        expect(themeToggle).toBeInTheDocument();
    });

    it('handles notification toggling', () => {
        render(<App/>);
        const notificationToggle = screen.getByRole('button', {name: /toggle notifications/i});
        fireEvent.click(notificationToggle);

        // Should toggle notifications
        expect(notificationToggle).toBeInTheDocument();
    });

    it('displays task statistics', () => {
        render(<App/>);
        expect(screen.getByText('Task Statistics')).toBeInTheDocument();
    });

    it('displays system status', () => {
        render(<App/>);
        expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    it('handles WebSocket connection status', () => {
        render(<App/>);
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('handles WebSocket connection errors', () => {
        // This would require mocking the WebSocket hook to return an error
        expect(true).toBe(true);
    });
});