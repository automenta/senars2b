import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

    const totalStat = screen.getByTestId('stat-item-Total');
    expect(within(totalStat).getByText('10')).toBeInTheDocument();

    const completedStat = screen.getByTestId('stat-item-Completed');
    expect(within(completedStat).getByText('5')).toBeInTheDocument();

    const failedStat = screen.getByTestId('stat-item-Failed');
    expect(within(failedStat).getByText('1')).toBeInTheDocument();

    const pendingStat = screen.getByTestId('stat-item-Pending');
    expect(within(pendingStat).getByText('2')).toBeInTheDocument();
  });

  it('should toggle content visibility on header click', () => {
    render(<StatsPanel stats={mockStats} />);
    const headerButton = screen.getByRole('button', {
      name: /Task Statistics/i,
    });

    // Content should be visible initially
    const totalStat = screen.getByTestId('stat-item-Total');
    expect(totalStat).toBeVisible();

    // Click to hide
    fireEvent.click(headerButton);
    expect(screen.queryByTestId('stat-item-Total')).not.toBeInTheDocument();

    // Click to show again
    fireEvent.click(headerButton);
    expect(screen.getByTestId('stat-item-Total')).toBeVisible();
  });

  it('should have correct aria attributes for accessibility', () => {
    render(<StatsPanel stats={mockStats} />);
    const headerButton = screen.getByRole('button', {
      name: /Task Statistics/i,
    });
    const content = document.getElementById('stats-panel-content');

    expect(headerButton).toHaveAttribute('aria-expanded', 'true');
    expect(headerButton).toHaveAttribute(
      'aria-controls',
      'stats-panel-content'
    );
    expect(content).toBeInTheDocument();

    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');
  });
});
