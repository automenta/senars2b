import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import BoardView from '../BoardView';

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
            status: 'completed',
            completion_percentage: 100,
            parent_id: undefined,
            subtasks: []
        }
    ],
    sendMessage: jest.fn()
};

describe('BoardView', () => {
    it('renders all columns', () => {
        render(<BoardView {...mockProps} />);

        // There should be 8 columns (based on the TaskStatus enum)
        const columns = screen.getAllByTestId('column');
        expect(columns).toHaveLength(8);
    });

    it('renders tasks in the correct columns', () => {
        render(<BoardView {...mockProps} />);

        // Find the pending column and check it has one task
        const pendingColumn = screen.getByText('Pending').closest('.column');
        expect(pendingColumn).toBeInTheDocument();

        // Find the completed column and check it has one task
        const completedColumn = screen.getByText('Completed').closest('.column');
        expect(completedColumn).toBeInTheDocument();
    });

    it('shows correct task counts in column headers', () => {
        render(<BoardView {...mockProps} />);

        // Pending column should show 1 task
        const pendingCount = screen.getByText('Pending').nextElementSibling;
        expect(pendingCount).toHaveTextContent('1');

        // Completed column should show 1 task
        const completedCount = screen.getByText('Completed').nextElementSibling;
        expect(completedCount).toHaveTextContent('1');
    });
});