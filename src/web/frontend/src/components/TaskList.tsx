import React from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, sendMessage }) => {
  return (
    <div>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} sendMessage={sendMessage} />
      ))}
    </div>
  );
};

export default TaskList;
