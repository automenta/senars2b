import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskList from '../src/web/frontend/src/components/TaskList';
import {Task} from '../src/interfaces/task';

const mockSendMessage = jest.fn();

const mockTasks: Task[] = [
    {
        id: '1',
        atom_id: 'atom-1',
        type: 'TASK',
        label: 'Parent Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'pending',
            priority_level: 'medium',
            completion_percentage: 0
        }
    },
    {
        id: '2',
        atom_id: 'atom-2',
        type: 'TASK',
        label: 'Child Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'pending',
            priority_level: 'medium',
            completion_percentage: 0,
            parent_id: '1'
        }
    }
];

describe('TaskList', () => {
    beforeEach(() => {
        mockSendMessage.mockClear();
    });

    it('renders tasks correctly', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        expect(screen.getByText('Parent Task')).toBeInTheDocument();
        expect(screen.getByText('Child Task')).toBeInTheDocument();
    });

    it('should handle task editing', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const editButton = screen.getByRole('button', {name: /edit/i});
        fireEvent.click(editButton);

        // Should open edit form
        expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    it('should handle task deletion', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const deleteButton = screen.getByRole('button', {name: /delete/i});
        fireEvent.click(deleteButton);

        // Should send delete message
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'DELETE_TASK',
            payload: {id: mockTasks[0].id}
        });
    });

    it('should handle task completion', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const completeButton = screen.getByRole('button', {name: /complete/i});
        fireEvent.click(completeButton);

        // Should send complete message
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'COMPLETE_TASK',
            payload: {id: mockTasks[0].id}
        });
    });

    it('should handle task pausing', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const pauseButton = screen.getByRole('button', {name: /pause/i});
        fireEvent.click(pauseButton);

        // Should send pause message
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'PAUSE_AGENT',
            payload: {id: mockTasks[0].id}
        });
    });

    it('should handle task resuming', () => {
        const pausedTask: Task = {
            ...mockTasks[0],
            task_metadata: {
                ...mockTasks[0].task_metadata!,
                status: 'deferred'
            }
        };

        render(<TaskList tasks={[pausedTask]} sendMessage={mockSendMessage}/>);

        const resumeButton = screen.getByRole('button', {name: /resume/i});
        fireEvent.click(resumeButton);

        // Should send resume message
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'RESUME_AGENT',
            payload: {id: pausedTask.id}
        });
    });

    it('should handle task stopping', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const stopButton = screen.getByRole('button', {name: /stop/i});
        fireEvent.click(stopButton);

        // Should send stop message
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'FAIL_TASK',
            payload: {id: mockTasks[0].id}
        });
    });

    it('should handle drag and drop reordering', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage} isSublist={true}/>);

        const taskItem = screen.getByText('Child Task').closest('.taskListItem');
        if (taskItem) {
            fireEvent.dragStart(taskItem, {dataTransfer: {effectAllowed: 'move'}});
            fireEvent.dragOver(taskItem, {dataTransfer: {dropEffect: 'move'}});
            fireEvent.drop(taskItem);
        }

        // Should handle drag events without error
        expect(taskItem).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
        render(<TaskList tasks={mockTasks} sendMessage={mockSendMessage}/>);

        const taskItem = screen.getByText('Parent Task');
        fireEvent.keyDown(taskItem, {key: 'ArrowDown'});
        fireEvent.keyDown(taskItem, {key: 'Enter'});

        // Should handle keyboard events without error
        expect(taskItem).toBeInTheDocument();
    });
});