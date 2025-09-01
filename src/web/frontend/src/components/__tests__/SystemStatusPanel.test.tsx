import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemStatusPanel from './SystemStatusPanel';

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

        // Check main statistics
        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Agenda Size')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();

        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should toggle content visibility on header click', () => {
        render(<SystemStatusPanel systemStatus={mockSystemStatus}/>);
        const headerButton = screen.getByRole('button', {name: /System Status/i});

        // Content should be visible initially
        expect(screen.getByText('Agenda Size')).toBeInTheDocument();

        // Click to hide
        headerButton.click();
        expect(screen.queryByText('Agenda Size')).not.toBeInTheDocument();

        // Click to show again
        headerButton.click();
        expect(screen.getByText('Agenda Size')).toBeInTheDocument();
    });

    it('should have correct aria attributes for accessibility', () => {
        render(<SystemStatusPanel systemStatus={mockSystemStatus}/>);
        const headerButton = screen.getByRole('button', {name: /System Status/i});
        const content = document.getElementById('system-status-panel-content');

        expect(headerButton).toHaveAttribute('aria-expanded', 'true');
        expect(headerButton).toHaveAttribute('aria-controls', 'system-status-panel-content');
        expect(content).toBeInTheDocument();
    });
});