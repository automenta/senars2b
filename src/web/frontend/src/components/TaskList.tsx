import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import TaskItem from './TaskItem';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
  isSublist?: boolean;
  selectedTaskIndex?: number;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, sendMessage, isSublist = false, selectedTaskIndex = -1 }) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const dropTargetId = useRef<string | null>(null);

  const taskMap = new Map(tasks.map(t => [t.id, t]));

  const tasksToRender = isSublist
    ? tasks
    : tasks.filter(t => !t.parent_id || !taskMap.has(t.parent_id));

  const listClassName = `${styles.taskList} ${isSublist ? styles.subTaskList : ''}`;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (id !== draggedItemId) {
      dropTargetId.current = id;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItemId || !dropTargetId.current) return;

    const parentId = tasks.find(t => t.id === draggedItemId)?.parent_id;
    if (!parentId) return;

    const subtasks = tasks.filter(t => t.parent_id === parentId);
    const draggedIndex = subtasks.findIndex(t => t.id === draggedItemId);
    const targetIndex = subtasks.findIndex(t => t.id === dropTargetId.current);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...subtasks];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    sendMessage({
      type: 'REORDER_SUBTASKS',
      payload: {
        parentId: parentId,
        orderedSubtaskIds: newOrder.map(t => t.id),
      },
    });

    setDraggedItemId(null);
    dropTargetId.current = null;
  };

  return (
    <div className={listClassName} onDragOver={isSublist ? e => e.preventDefault() : undefined} onDrop={isSublist ? handleDrop : undefined}>
      <AnimatePresence>
        {tasksToRender.map((task, index) => (
          <div
            key={task.id}
            className={`${styles.taskListItem} ${draggedItemId === task.id ? styles.dragging : ''}`}
            draggable={isSublist}
            onDragStart={isSublist ? (e) => handleDragStart(e, task.id) : undefined}
            onDragOver={isSublist ? (e) => handleDragOver(e, task.id) : undefined}
          >
            <TaskItem
              task={task}
              allFilteredTasks={tasks}
              sendMessage={sendMessage}
              isDraggable={isSublist}
              isSelected={!isSublist && index === selectedTaskIndex}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;
