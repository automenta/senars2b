import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import TaskItem from './TaskItem';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
  isSublist?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, sendMessage, isSublist = false }) => {
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  const tasksToRender = isSublist
    ? tasks
    : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id));

  const listClassName = `${styles.taskList} ${isSublist ? styles.subTaskList : ''}`;

  return (
    <div className={listClassName}>
      <AnimatePresence>
        {tasksToRender.map(task => (
          <div key={task.id} className={styles.taskListItem}>
            <TaskItem
              task={task}
              allFilteredTasks={tasks}
              sendMessage={sendMessage}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;
