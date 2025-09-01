import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedTaskList from '../EnhancedTaskList';
import {Task} from '../../types';

// Mock React
const mockProps = {
    tasks: [
        {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            priority: 'high',
            type: 'REGULAR',
            status: 'pending',
            completion_percentage: 0,
            parent_id: undefined,
            subtasks: []
        },
        {
            id: '2',
            title: 'Task 2',
            description: 'Description 2',
            priority: 'medium',
            type: 'REGULAR',
            status: 'pending',
            completion_percentage: 0,
            parent_id: undefined,
            subtasks: []
        }
    ],
    sendMessage: jest.fn()
};

describe('EnhancedTaskList', () => {
    it('renders a list of tasks', () => {
        render(<EnhancedTaskList {...mockProps} />);

        const taskItems = screen.getAllByTestId('task-item');
        expect(taskItems).toHaveLength(2);
    });

    it('renders as a sublist when isSublist is true', () => {
        render(<EnhancedTaskList {...mockProps} isSublist={true}/>);

        const taskList = screen.getByTestId('enhanced-task-list');
        expect(taskList).toHaveClass('subTaskList');
    });

    it('filters out subtasks when rendering main list', () => {
        const tasksWithSubtasks: Task[] = [
            {
                id: '1',
                title: 'Parent Task',
                description: 'Parent description',
                priority: 'high',
                type: 'REGULAR',
                status: 'pending',
                completion_percentage: 0,
                parent_id: undefined,
                subtasks: ['2']
            },
            {
                id: '2',
                title: 'Subtask',
                description: 'Subtask description',
                priority: 'medium',
                type: 'REGULAR',
                status: 'pending',
                completion_percentage: 0,
                parent_id: '1',
                subtasks: []
            }
        ];

        render(<EnhancedTaskList tasks={tasksWithSubtasks} sendMessage={jest.fn()}/>);

        const taskItems = screen.getAllByTestId('task-item');
        // Should only render 1 task (the parent task), not the subtask
        expect(taskItems).toHaveLength(1);
        expect(screen.getByText('Parent Task')).toBeInTheDocument();
        expect(screen.queryByText('Subtask')).not.toBeInTheDocument();
    });
});