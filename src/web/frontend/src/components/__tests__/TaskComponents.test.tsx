import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskEntity from '../src/components/task/TaskEntity';
import TaskCollection from '../src/components/task/TaskCollection';
import TaskBoard from '../src/components/task/TaskBoard';
import {Task} from '../src/types';

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

// Mock task data
const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'This is a test task',
    status: 'pending',
    priority: 'medium',
    type: 'REGULAR',
    subtasks: [],
    creation_time: Date.now()
};

const mockAgentTask: Task = {
    id: 'task-2',
    title: 'Agent Task',
    description: 'This is an agent task',
    status: 'pending',
    priority: 'high',
    type: 'AGENT',
    subtasks: [],
    creation_time: Date.now()
};

describe('TaskEntity', () => {
    it('renders task title and description', () => {
        render(<TaskEntity task={mockTask}/>);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('This is a test task')).toBeInTheDocument();
    });

    it('shows priority and status badges', () => {
        render(<TaskEntity task={mockTask}/>);

        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('shows agent-specific actions for agent tasks', () => {
        render(<TaskEntity task={mockAgentTask}/>);

        // Should show play/pause/stop buttons for agent tasks
        expect(screen.getByLabelText('Pause task')).toBeInTheDocument();
        expect(screen.getByLabelText('Stop task')).toBeInTheDocument();
    });

    it('shows complete button for regular tasks', () => {
        render(<TaskEntity task={mockTask}/>);

        // Should show complete button for regular tasks
        expect(screen.getByLabelText('Complete task')).toBeInTheDocument();
    });
});

describe('TaskCollection', () => {
    const mockTasks = [mockTask, mockAgentTask];

    it('renders all tasks', () => {
        render(
            <TaskCollection
                tasks={mockTasks}
                selectedTaskIds={[]}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Agent Task')).toBeInTheDocument();
    });
});

describe('TaskBoard', () => {
    const mockTasks = [mockTask, mockAgentTask];

    it('renders board title', () => {
        render(<TaskBoard tasks={mockTasks} title="My Tasks"/>);

        expect(screen.getByText('My Tasks')).toBeInTheDocument();
    });

    it('shows add task button', () => {
        render(<TaskBoard tasks={mockTasks}/>);

        expect(screen.getByText('+ Add Task')).toBeInTheDocument();
    });
});