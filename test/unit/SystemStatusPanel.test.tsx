import React from 'react';
import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemStatusPanel from '../../src/web/frontend/src/components/SystemStatusPanel';

describe('SystemStatusPanel', () => {
    it('renders loading state when systemStatus is null', () => {
        render(<SystemStatusPanel systemStatus={null}/>);
        expect(screen.getByText('Loading system status...')).toBeInTheDocument();
    });

    it('renders system status correctly when provided', () => {
        const mockSystemStatus = {
            agendaSize: 5,
            workerStats: {
                running: 2,
                idle: 3,
            },
            performance: {
                totalItemsProcessed: 100,
                averageProcessingTime: 50.5,
            },
            worldModelStats: {
                totalItems: 200,
                beliefCount: 150,
                goalCount: 50,
            },
        };
        render(<SystemStatusPanel systemStatus={mockSystemStatus}/>);

        expect(screen.getByText('System Status')).toBeInTheDocument();
        expect(screen.getByText('Agenda Size:')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Workers Running:')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
