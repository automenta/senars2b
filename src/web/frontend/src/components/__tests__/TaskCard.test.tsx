import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCard from '../TaskCard';
import {Task} from '../../types';
import * as taskUtils from '../../utils/taskUtils';

// Mock the store
jest.mock('../../store', () => ({
    useStore: () => ({
        getPendingPrompts: jest.fn(() => [])
    })
}));

// Mock taskUtils
jest.mock('../../utils/taskUtils', () => ({
    taskUtils: {
        isCompleted: jest.fn(),
        isFailed: jest.fn(),
        isInProgress: jest.fn()
    }
}));

const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'This is a test task',
    priority: 'medium',
    type: 'REGULAR',
    status: 'pending',
    completion_percentage: 0,
    parent_id: undefined,
    subtasks: []
};

const mockProps = {
    task: mockTask,
    allFilteredTasks: [mockTask],
    sendMessage: jest.fn(),
    isEditing: false,
    isExpanded: false,
    onToggleExpand: jest.fn(),
    onEdit: jest.fn(),
    onSave: jest.fn(),
    onCancelEdit: jest.fn(),
    onTitleChange: jest.fn(),
    onDescriptionChange: jest.fn(),
    editedTitle: 'Test Task',
    editedDescription: 'This is a test task'
};

describe('TaskCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (taskUtils.taskUtils.isCompleted as jest.Mock).mockReturnValue(false);
        (taskUtils.taskUtils.isFailed as jest.Mock).mockReturnValue(false);
        (taskUtils.taskUtils.isInProgress as jest.Mock).mockReturnValue(false);
    });

    it('renders task title and description correctly', () => {
        render(<TaskCard {...mockProps} />);

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('This is a test task')).toBeInTheDocument();
    });

    it('renders edit button when not editing', () => {
        render(<TaskCard {...mockProps} />);

        expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders save and cancel buttons when editing', () => {
        render(<TaskCard {...mockProps} isEditing={true}/>);

        expect(screen.getByTestId('save-icon')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders input fields when editing', () => {
        render(<TaskCard {...mockProps} isEditing={true}/>);

        const titleInput = screen.getByDisplayValue('Test Task');
        const descriptionInput = screen.getByDisplayValue('This is a test task');

        expect(titleInput).toBeInTheDocument();
        expect(descriptionInput).toBeInTheDocument();
    });

    it('applies dimmed class when task is completed', () => {
        (taskUtils.taskUtils.isCompleted as jest.Mock).mockReturnValue(true);

        render(<TaskCard {...mockProps} />);

        const item = screen.getByTestId('task-item');
        expect(item).toHaveClass('dimmed');
    });

    it('applies dimmed class when task is failed', () => {
        (taskUtils.taskUtils.isFailed as jest.Mock).mockReturnValue(true);

        render(<TaskCard {...mockProps} />);

        const item = screen.getByTestId('task-item');
        expect(item).toHaveClass('dimmed');
    });

    it('applies processing class when task is in progress', () => {
        (taskUtils.taskUtils.isInProgress as jest.Mock).mockReturnValue(true);

        render(<TaskCard {...mockProps} />);

        const item = screen.getByTestId('task-item');
        expect(item).toHaveClass('processing');
    });
});