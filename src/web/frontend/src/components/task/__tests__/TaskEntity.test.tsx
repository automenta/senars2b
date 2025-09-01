import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskEntity from '../src/components/task/TaskEntity';

// Mock the useTaskActions hook
jest.mock('../src/hooks/useTaskActions', () => ({
    useTaskActions: () => ({
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
        completeTask: jest.fn(),
        pauseTask: jest.fn(),
        resumeTask: jest.fn(),
        failTask: jest.fn()
    })
}));

describe('TaskEntity', () => {
    const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        priority: 'medium',
        type: 'REGULAR',
        subtasks: [],
        creation_time: Date.now()
    };

    it('renders task title and description', () => {
        render(<TaskEntity task={mockTask}/>);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('This is a test task')).toBeInTheDocument();
    });

    it('shows priority badge', () => {
        render(<TaskEntity task={mockTask}/>);
        expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('shows status badge', () => {
        render(<TaskEntity task={mockTask}/>);
        expect(screen.getByText('pending')).toBeInTheDocument();
    });
});