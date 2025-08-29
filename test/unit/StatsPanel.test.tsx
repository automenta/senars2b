import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsPanel from '../../src/web/frontend/src/components/StatsPanel';
import { TaskStatistics } from '../../src/web/frontend/src/types';

describe('StatsPanel', () => {
  const mockStats: TaskStatistics = {
    total: 10,
    completed: 5,
    failed: 1,
    pending: 2,
    deferred: 2,
    awaiting_dependencies: 1,
    decomposing: 1,
    awaiting_subtasks: 1,
    ready_for_execution: 1,
  };

  it('should render loading state when stats are null', () => {
    render(<StatsPanel stats={null} />);
    expect(screen.getByText('Loading stats...')).toBeInTheDocument();
  });

  it('should render all statistics when stats are provided', () => {
    render(<StatsPanel stats={mockStats} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should toggle content visibility on header click', () => {
    render(<StatsPanel stats={mockStats} />);
    const headerButton = screen.getByRole('button', { name: /Task Statistics/i });

    // Content should be visible initially
    expect(screen.getByText('Total')).toBeVisible();

    // Click to hide
    fireEvent.click(headerButton);
    expect(screen.queryByText('Total')).not.toBeVisible();

    // Click to show again
    fireEvent.click(headerButton);
    expect(screen.getByText('Total')).toBeVisible();
  });

  it('should have correct aria attributes for accessibility', () => {
    render(<StatsPanel stats={mockStats} />);
    const headerButton = screen.getByRole('button', { name: /Task Statistics/i });
    const content = document.getElementById('stats-panel-content');

    expect(headerButton).toHaveAttribute('aria-expanded', 'true');
    expect(headerButton).toHaveAttribute('aria-controls', 'stats-panel-content');
    expect(content).toBeInTheDocument();

    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });
});
