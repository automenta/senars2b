import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskList from '../../src/web/frontend/src/components/TaskList';
import {
  Task,
  TaskStatus,
  TaskPriority,
} from '../../src/interfaces/sharedTypes';
import '@testing-library/jest-dom';

// Mock the TaskItem component to simplify the test
jest.mock('../../src/web/frontend/src/components/TaskItem', () => {
  return {
    __esModule: true,
    default: jest.fn(({ task }) => (
      <div data-testid="task-item">{task.title}</div>
    )),
  };
});

// Helper to create a mock task
const createTask = (
  id: string,
  title: string,
  status: TaskStatus,
  priority: TaskPriority
): Task => ({
  id,
  type: 'REGULAR',
  title,
  status,
  priority,
  subtasks: [],
  completion_percentage: 0,
});

describe('TaskList', () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    // Clear mock calls before each test
    mockSendMessage.mockClear();
    (
      require('../../src/web/frontend/src/components/TaskItem')
        .default as jest.Mock
    ).mockClear();
  });

  it('should render a list of tasks without crashing', () => {
    const tasks: Task[] = [
      createTask('1', 'Task 1', 'pending', 'high'),
      createTask('2', 'Task 2', 'completed', 'medium'),
      createTask('3', 'Task 3', 'failed', 'low'),
    ];

    render(<TaskList tasks={tasks} sendMessage={mockSendMessage} />);

    // Check if the task titles are present in the document
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();

    // Check if TaskItem was called for each task
    expect(
      require('../../src/web/frontend/src/components/TaskItem').default
    ).toHaveBeenCalledTimes(3);
  });

  it('should render an empty container when the task list is empty', () => {
    render(<TaskList tasks={[]} sendMessage={mockSendMessage} />);

    // The list container should be in the document but have no direct task item children
    const taskList = screen.getByTestId('task-list');
    const taskItems = screen.queryAllByTestId('task-item');

    expect(taskList).toBeInTheDocument();
    expect(taskItems.length).toBe(0);
  });
});
