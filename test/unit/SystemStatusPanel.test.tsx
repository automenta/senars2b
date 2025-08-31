import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemStatusPanel from '../../src/web/frontend/src/components/SystemStatusPanel';

describe('SystemStatusPanel', () => {
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

  it('renders loading state when systemStatus is null', () => {
    render(<SystemStatusPanel systemStatus={null} />);
    expect(screen.getByText('Loading system status...')).toBeInTheDocument();
  });

  it('renders system status correctly when provided', () => {
    render(<SystemStatusPanel systemStatus={mockSystemStatus} />);

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Agenda Size')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Workers Running')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should toggle content visibility on header click', () => {
    render(<SystemStatusPanel systemStatus={mockSystemStatus} />);
    const headerButton = screen.getByRole('button', { name: /System Status/i });

    // Content should be visible initially
    expect(screen.getByText('Agenda Size')).toBeVisible();

    // Click to hide
    fireEvent.click(headerButton);
    // Use queryByText for non-existence check
    expect(screen.queryByText('Agenda Size')).not.toBeInTheDocument();

    // Click to show again
    fireEvent.click(headerButton);
    expect(screen.getByText('Agenda Size')).toBeVisible();
  });

  it('should have correct aria attributes for accessibility', () => {
    render(<SystemStatusPanel systemStatus={mockSystemStatus} />);
    const headerButton = screen.getByRole('button', { name: /System Status/i });
    const content = document.getElementById('system-status-panel-content');

    expect(headerButton).toHaveAttribute('aria-expanded', 'true');
    expect(headerButton).toHaveAttribute(
      'aria-controls',
      'system-status-panel-content'
    );
    expect(content).toBeInTheDocument();

    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });
});
