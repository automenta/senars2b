import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsPanel from '../../src/web/frontend/src/components/StatsPanel';

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

    it('should render statistics when provided', () => {
        render(<StatsPanel stats={mockStats}/>);
        expect(screen.getByText('Task Statistics')).toBeInTheDocument();
    });
});