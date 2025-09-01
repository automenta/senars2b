import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsPanel from './StatsPanel';

// Mock task statistics data
const mockStats = {
    total: 10,
    pending: 3,
    awaiting_dependencies: 1,
    decomposing: 2,
    awaiting_subtasks: 1,
    ready_for_execution: 1,
    completed: 5,
    failed: 1,
    deferred: 2
};

describe('StatsPanel', () => {
    it('should render loading state when stats are null', () => {
        render(<StatsPanel stats={null}/>);
        expect(screen.getByText('Loading stats...')).toBeInTheDocument();
    });

    it('should render all statistics when stats are provided', () => {
        render(<StatsPanel stats={mockStats}/>);

        // Check main statistics
        expect(screen.getByText('Task Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();

        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Check processing statistics
        expect(screen.getByText('Awaiting Dependencies')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        expect(screen.getByText('Decomposing')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        expect(screen.getByText('Awaiting Subtasks')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        expect(screen.getByText('Ready for Execution')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();

        expect(screen.getByText('Deferred')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});