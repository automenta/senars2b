import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskEditor from '../TaskEditor';
import {Task} from '../../types';

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
    onSave: jest.fn(),
    onDelete: jest.fn(),
    onClose: jest.fn(),
    isOpen: true
};

describe('TaskEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders task details correctly when open', () => {
        render(<TaskEditor {...mockProps} />);

        expect(screen.getByText('Edit Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('This is a test task')).toBeInTheDocument();
    });

    it('calls onSave when save button is clicked', () => {
        render(<TaskEditor {...mockProps} />);

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(mockProps.onSave).toHaveBeenCalledTimes(1);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', () => {
        render(<TaskEditor {...mockProps} />);

        // Click delete button
        const deleteButton = screen.getByText('Delete Task');
        fireEvent.click(deleteButton);

        // Click confirm delete
        const confirmDeleteButton = screen.getByText('Yes, Delete');
        fireEvent.click(confirmDeleteButton);

        expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('updates task title when input changes', () => {
        render(<TaskEditor {...mockProps} />);

        const titleInput = screen.getByDisplayValue('Test Task');
        fireEvent.change(titleInput, {target: {value: 'Updated Task Title'}});

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);

        expect(mockProps.onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Updated Task Title'
            })
        );
    });

    it('does not call onDelete when cancel is clicked during delete confirmation', () => {
        render(<TaskEditor {...mockProps} />);

        // Click delete button
        const deleteButton = screen.getByText('Delete Task');
        fireEvent.click(deleteButton);

        // Click cancel instead of confirm
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockProps.onDelete).not.toHaveBeenCalled();
        expect(mockProps.onClose).not.toHaveBeenCalled();
    });
});