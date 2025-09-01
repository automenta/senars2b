import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemStatusPanel from '../../src/web/frontend/src/components/SystemStatusPanel';

// Mock system status data
const mockSystemStatus = {
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

describe('SystemStatusPanel', () => {
    it('renders loading state when systemStatus is null', () => {
        render(<SystemStatusPanel systemStatus={null}/>);
        expect(screen.getByText('Loading system status...')).toBeInTheDocument();
    });

    it('renders system status correctly when provided', () => {
        render(<SystemStatusPanel systemStatus={mockSystemStatus}/>);
        expect(screen.getByText('System Status')).toBeInTheDocument();
    });
});