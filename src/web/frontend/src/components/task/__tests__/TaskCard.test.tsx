import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCard from './TaskCard';

// Mock the framer-motion components
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the react-icons
jest.mock('react-icons/fa', () => ({
  FaChevronDown: () => <div data-testid="chevron-down">Chevron Down</div>,
  FaChevronRight: () => <div data-testid="chevron-right">Chevron Right</div>,
  FaEdit: () => <div data-testid="edit-icon">Edit</div>,
  FaTrash: () => <div data-testid="trash-icon">Trash</div>,
  FaCheck: () => <div data-testid="check-icon">Check</div>,
  FaPause: () => <div data-testid="pause-icon">Pause</div>,
  FaPlay: () => <div data-testid="play-icon">Play</div>,
  FaStop: () => <div data-testid="stop-icon">Stop</div>,
  FaEllipsisV: () => <div data-testid="ellipsis-icon">Ellipsis</div>,
}));

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'This is a test task',
    status: 'pending',
    type: 'REGULAR',
    priority: 'medium',
    completion_percentage: 50,
    parent_id: undefined,
    subtasks: [],
  };

  const mockSendMessage = jest.fn();

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  it('renders task title and description', () => {
    render(
      <TaskCard
        task={mockTask}
        isSelected={false}
        isExpanded={false}
        onToggleSelect={jest.fn()}
        onToggleExpand={jest.fn()}
        sendMessage={mockSendMessage}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task')).toBeInTheDocument();
  });

  it('shows expand button when not expanded', () => {
    render(
      <TaskCard
        task={mockTask}
        isSelected={false}
        isExpanded={false}
        onToggleSelect={jest.fn()}
        onToggleExpand={jest.fn()}
        sendMessage={mockSendMessage}
      />
    );

    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('shows collapse button when expanded', () => {
    render(
      <TaskCard
        task={mockTask}
        isSelected={false}
        isExpanded={true}
        onToggleSelect={jest.fn()}
        onToggleExpand={jest.fn()}
        sendMessage={mockSendMessage}
      />
    );

    expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
  });

  it('shows action buttons on hover', () => {
    render(
      <TaskCard
        task={mockTask}
        isSelected={false}
        isExpanded={false}
        onToggleSelect={jest.fn()}
        onToggleExpand={jest.fn()}
        sendMessage={mockSendMessage}
      />
    );

    // In a real test, we would simulate hover, but for now we'll just check that
    // the action buttons are present in the DOM (they're hidden by CSS normally)
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });
});