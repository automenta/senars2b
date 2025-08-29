import React from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
  isSublist?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, sendMessage, isSublist = false }) => {
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // For the main list, we only want to render top-level tasks.
  // A task is top-level if its parent is not in the current filtered list.
  const tasksToRender = isSublist
    ? tasks
    : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id));

  const listClassName = isSublist ? "sub-task-list" : "task-list";

  return (
    <div className={listClassName}>
      {tasksToRender.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          allFilteredTasks={tasks} // Pass the whole filtered list for context
          sendMessage={sendMessage}
        />
      ))}
    </div>
  );
};

export default TaskList;
